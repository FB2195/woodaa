// Ad-hoc signing ("-", no real Apple identity) turns out to be insufficient
// on real Apple-Silicon hardware: AMFI/Hardened Runtime won't actually grant
// entitlements like allow-jit/allow-unsigned-executable-memory to ad-hoc
// signed code, so V8 crashes on startup on a real Mac even though the
// signature and entitlements look completely valid via `codesign -dvvv`
// (confirmed - GitHub's macOS CI runners are Apple-hosted VMs that don't
// enforce this the same way real hardware does, which is why CI never
// caught it). The durable fix is a real "Developer ID Application"
// certificate + notarization, not another ad-hoc workaround.
//
// Once CSC_LINK is set (see desktop-release.yml), electron-builder detects
// the imported real certificate itself, signs with it, applies
// mac.entitlements/entitlementsInherit, and auto-notarizes via the
// APPLE_API_KEY/APPLE_API_KEY_ID/APPLE_API_ISSUER env vars - all before this
// hook even runs. In that case this hook must NOT touch the bundle at all,
// or it would clobber that real signature with an ad-hoc one again.
//
// Without CSC_LINK (e.g. no Apple Developer account configured yet, or a
// local unsigned dev build), electron-builder skips signing entirely (no
// "Developer ID Application" identity found in the keychain) - it never
// touches mac.entitlements/entitlementsInherit in that case either. This
// hook then falls back to force-signing the packaged .app ad-hoc so it's at
// least launchable in environments that don't enforce the real-hardware
// entitlement restriction (e.g. our own CI smoke test). This ad-hoc
// fallback is known to NOT be sufficient on real Apple-Silicon Macs - see
// above.
//
// Signing has to happen inside-out (every nested .framework/.app signed
// individually, deepest first, then the outer bundle last) rather than via
// `codesign --deep`, which re-signs everything in one pass with the same
// flat entitlements and turned out to corrupt something Electron/V8 needs -
// the packaged app crashed on startup every time despite a seemingly valid
// signature, and only stopped once --deep was replaced with this explicit
// inside-out signing.
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

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
  // frameworks are signed before the bundles that contain them.
  return targets.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);
}

exports.default = async function afterSign(context) {
  if (context.electronPlatformName !== "darwin") return;

  if (process.env.CSC_LINK) {
    console.log(
      "afterSignAdhoc: CSC_LINK is set - electron-builder already signed with a real " +
        "Developer ID certificate (and will notarize), skipping the ad-hoc fallback.",
    );
    return;
  }

  const appOutDir = context.appOutDir;
  const appName = fs.readdirSync(appOutDir).find((f) => f.endsWith(".app"));
  if (!appName) {
    throw new Error(`afterSignAdhoc: no .app bundle found in ${appOutDir}`);
  }
  const appPath = path.join(appOutDir, appName);
  const entitlements = path.join(__dirname, "..", "resources", "entitlements.mac.plist");

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

  // Print the resulting signature to the CI log so a broken entitlements/
  // runtime-flag regression shows up here instead of only surfacing as a
  // crash report from a real Mac days later.
  execFileSync("codesign", ["-dvvv", "--entitlements", "-", appPath], { stdio: "inherit" });
};
