// Real code signing and notarization happen entirely in this hook, NOT via
// electron-builder's own built-in signing (@electron/osx-sign). This is
// deliberate: 22 CI runs (see desktop-release.yml's diagnostic smoke tests)
// isolated the cause of an intermittent startup crash (EXC_BREAKPOINT/
// SIGTRAP inside V8, before any woodaa code runs, "brk 0" trap) precisely
// to electron-builder's own signing method - it signs every nested
// .framework/.app individually ("properly", the Apple-recommended way).
// A packaged app re-signed with a single flat `codesign --deep` pass
// instead ran cleanly in 14/14 CI attempts, vs. roughly 60% crash rate for
// the electron-builder-signed original (not chance - p < 0.001). Every
// other candidate (ad-hoc vs. real signing, .asar packaging, window
// visibility, safeStorage/preload/ipcMain, the renderer bundle, Electron
// itself) was ruled out first.
//
// WOODAA_CSC_LINK/WOODAA_CSC_KEY_PASSWORD (set in desktop-release.yml) are
// deliberately NOT named CSC_LINK/CSC_KEY_PASSWORD - those are the names
// electron-builder auto-detects and signs with itself, which is exactly
// what this hook needs to prevent so it has full control instead. Because
// electron-builder never finds a signing identity this way, it also skips
// its own auto-notarize step (notarization requires an already-signed
// app), so this hook has to do that too: sign, notarize, staple.
//
// Without WOODAA_CSC_LINK (e.g. a local dev build with no Apple Developer
// account configured), this falls back to ad-hoc signing so the app is at
// least launchable for local testing. Ad-hoc signing is NOT sufficient on
// real Apple Silicon hardware (AMFI won't grant hardened-runtime
// entitlements like allow-jit to it), so this fallback is for local
// development only, never for a distributed release.
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const crypto = require("node:crypto");

function findNestedCodeTargets(appPath) {
  const targets = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (entry.name.endsWith(".framework") || entry.name.endsWith(".app")) {
        targets.push(full);
      }
      walk(full);
    }
  }
  walk(path.join(appPath, "Contents"));
  // Deepest paths (most path separators) first, so nested helper apps and
  // frameworks are signed before the bundles that contain them. Only
  // relevant to the ad-hoc fallback below - the real path signs everything
  // in one flat --deep pass instead.
  return targets.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);
}

const MACHO_MAGICS = new Set([0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe, 0xcafebabe, 0xbebafeca]);

function isMachO(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(4);
    if (fs.readSync(fd, buf, 0, 4, 0) < 4) return false;
    return MACHO_MAGICS.has(buf.readUInt32BE(0));
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

// A file directly inside a "MacOS" directory is an .app bundle's own main
// executable (Apple convention - nothing else lives there), and a file
// directly inside "Versions/<X>/" is a .framework's own primary binary
// (also an Apple convention: <Fw>.framework/Versions/A/<Fw>). Both are
// already correctly signed by codesign --deep, as part of properly
// signing their enclosing bundle - re-signing them again via their raw
// file path (bypassing the bundle-level codesign invocation --deep uses)
// produces an invalid signature instead of a harmless no-op, confirmed by
// notarization rejecting a first attempt at this with "The signature of
// the binary is invalid" on exactly these files. Only files that live
// *underneath* one more directory level (Libraries/, Resources/,
// Helpers/) are the ones --deep leaves untouched.
function isBundlePrimaryBinary(filePath) {
  const parts = filePath.split(path.sep);
  const parent = parts[parts.length - 2];
  const grandparent = parts[parts.length - 3];
  return parent === "MacOS" || grandparent === "Versions";
}

// `codesign --deep` recurses into nested .framework/.app bundles but is
// known to miss loose Mach-O files sitting directly in a Resources/
// Libraries/Helpers folder - confirmed by notarization rejecting woodaa's
// build over unsigned GPU-fallback dylibs (libEGL.dylib,
// libvk_swiftshader.dylib, libGLESv2.dylib, libffmpeg.dylib) and
// Squirrel's "ShipIt" helper executable, none of which --deep touched.
// This walks the whole bundle and force-signs every such loose executable
// Mach-O file it finds - unconditionally, not just ones that look
// unsigned, because several of these dylibs ship from their vendors with
// a pre-existing (non-Developer-ID) signature that makes a plain
// `codesign -dv` check report them as "already signed" when they're not
// signed with OUR identity at all.
function signLooseMachO(appPath, identity, entitlements, keychainPath) {
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!(fs.statSync(full).mode & 0o111)) continue;
      if (!isMachO(full)) continue;
      if (isBundlePrimaryBinary(full)) continue;
      console.log(`afterSign: signing loose Mach-O ${full}`);
      execFileSync(
        "codesign",
        [
          "--force",
          "--options",
          "runtime",
          "--timestamp",
          "--sign",
          identity,
          "--entitlements",
          entitlements,
          "--keychain",
          keychainPath,
          full,
        ],
        { stdio: "inherit" },
      );
    }
  }
  walk(path.join(appPath, "Contents"));
}

function signRealFlatDeep(appPath, entitlements) {
  const keychainPath = path.join(os.tmpdir(), `woodaa-signing-${crypto.randomUUID()}.keychain-db`);
  const keychainPassword = crypto.randomUUID();
  const certPath = path.join(os.tmpdir(), `woodaa-cert-${crypto.randomUUID()}.p12`);

  try {
    execFileSync("security", ["create-keychain", "-p", keychainPassword, keychainPath]);
    execFileSync("security", ["set-keychain-settings", "-lut", "21600", keychainPath]);
    execFileSync("security", ["unlock-keychain", "-p", keychainPassword, keychainPath]);

    fs.writeFileSync(certPath, Buffer.from(process.env.WOODAA_CSC_LINK, "base64"));
    execFileSync("security", [
      "import",
      certPath,
      "-k",
      keychainPath,
      "-P",
      process.env.WOODAA_CSC_KEY_PASSWORD,
      "-T",
      "/usr/bin/codesign",
    ]);
    execFileSync("security", [
      "set-key-partition-list",
      "-S",
      "apple-tool:,apple:,codesign:",
      "-s",
      "-k",
      keychainPassword,
      keychainPath,
    ]);

    const existingKeychains = execFileSync("security", ["list-keychains", "-d", "user"])
      .toString()
      .split("\n")
      .map((line) => line.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
    execFileSync("security", ["list-keychains", "-d", "user", "-s", keychainPath, ...existingKeychains]);

    const identityList = execFileSync("security", ["find-identity", "-v", "-p", "codesigning", keychainPath]).toString();
    const hashMatch = identityList.match(/^\s*\d+\)\s+([A-F0-9]{40})\s+"Developer ID Application/m);
    if (!hashMatch) {
      throw new Error("afterSign: no Developer ID Application identity found in the imported keychain");
    }
    const identity = hashMatch[1];
    console.log(`afterSign: signing with real identity ${identity} (flat --deep)`);

    execFileSync(
      "codesign",
      [
        "--deep",
        "--force",
        "--options",
        "runtime",
        "--timestamp",
        "--sign",
        identity,
        "--entitlements",
        entitlements,
        "--keychain",
        keychainPath,
        appPath,
      ],
      { stdio: "inherit" },
    );

    // Nested frameworks/apps each carry their own separate embedded
    // signature (not byte-hashed into the outer bundle's own seal), so
    // signing these loose files after the --deep pass above doesn't
    // invalidate the outer app's already-valid signature - no need to
    // re-seal it again afterward.
    signLooseMachO(appPath, identity, entitlements, keychainPath);

    console.log("afterSign: signature details after signing (checking for Timestamp=...):");
    execFileSync("codesign", ["-dvvv", appPath], { stdio: "inherit" });
  } finally {
    fs.rmSync(certPath, { force: true });
    try {
      execFileSync("security", ["delete-keychain", keychainPath]);
    } catch {
      // best-effort cleanup only
    }
  }
}

function notarizeAndStaple(appPath) {
  const zipPath = path.join(os.tmpdir(), `woodaa-notarize-${crypto.randomUUID()}.zip`);
  execFileSync("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appPath, zipPath], { stdio: "inherit" });
  const notarytoolArgs = [
    "--key",
    process.env.APPLE_API_KEY,
    "--key-id",
    process.env.APPLE_API_KEY_ID,
    "--issuer",
    process.env.APPLE_API_ISSUER,
  ];
  let submitOutput;
  try {
    submitOutput = execFileSync("xcrun", ["notarytool", "submit", zipPath, ...notarytoolArgs, "--wait"]).toString();
    console.log(submitOutput);
  } finally {
    fs.rmSync(zipPath, { force: true });
  }

  // notarytool submit --wait exits 0 once it has a terminal status, even
  // when that status is a rejection - the acceptance has to be checked
  // from its output, not its exit code. On rejection, fetch the detailed
  // log (the plain submit output only ever says "Invalid", never why) so
  // a CI failure is diagnosable here instead of needing a manual re-run.
  const idMatch = submitOutput.match(/id: ([a-f0-9-]{36})/);
  const statusMatch = submitOutput.match(/^\s*status:\s+(\w+)/m);
  const status = statusMatch ? statusMatch[1] : "unknown";
  if (status !== "Accepted") {
    if (idMatch) {
      console.error(`afterSign: notarization status "${status}" - fetching detailed log for ${idMatch[1]}...`);
      try {
        execFileSync("xcrun", ["notarytool", "log", idMatch[1], ...notarytoolArgs], { stdio: "inherit" });
      } catch (logError) {
        console.error("afterSign: failed to fetch notarization log:", logError.message);
      }
    }
    throw new Error(`afterSign: notarization was not accepted (status: ${status})`);
  }

  execFileSync("xcrun", ["stapler", "staple", appPath], { stdio: "inherit" });
}

exports.default = async function afterSign(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appOutDir = context.appOutDir;
  const appName = fs.readdirSync(appOutDir).find((f) => f.endsWith(".app"));
  if (!appName) {
    throw new Error(`afterSign: no .app bundle found in ${appOutDir}`);
  }
  const appPath = path.join(appOutDir, appName);
  const entitlements = path.join(__dirname, "..", "resources", "entitlements.mac.plist");

  if (process.env.WOODAA_CSC_LINK) {
    signRealFlatDeep(appPath, entitlements);
    console.log("afterSign: notarizing and stapling...");
    notarizeAndStaple(appPath);
    execFileSync("codesign", ["-dvvv", "--entitlements", "-", appPath], { stdio: "inherit" });
    return;
  }

  console.log("afterSign: WOODAA_CSC_LINK not set - falling back to ad-hoc signing (local dev build only).");
  const sign = (target) => {
    execFileSync(
      "codesign",
      ["--force", "--options", "runtime", "--sign", "-", "--entitlements", entitlements, target],
      { stdio: "inherit" },
    );
  };
  for (const target of findNestedCodeTargets(appPath)) {
    sign(target);
  }
  sign(appPath);
  execFileSync("codesign", ["-dvvv", "--entitlements", "-", appPath], { stdio: "inherit" });
};
