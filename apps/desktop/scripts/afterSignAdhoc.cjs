// electron-builder skips macOS code signing entirely when no "Developer ID
// Application" certificate is installed (no paid Apple Developer account
// here yet) - it never touches mac.entitlements/entitlementsInherit in that
// case. Without any signature, Apple Silicon Macs still ad-hoc-sign the
// arm64 binary at first launch, but with no entitlements at all, which
// makes V8 crash immediately (no JIT / no unsigned executable memory).
// This hook force-signs the packaged .app ad-hoc ("-") with our
// entitlements so V8 can actually run, independent of whether a real
// certificate is ever configured.
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
