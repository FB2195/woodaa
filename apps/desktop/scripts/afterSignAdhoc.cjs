// electron-builder skips macOS code signing entirely when no "Developer ID
// Application" certificate is installed (no paid Apple Developer account
// here yet) - it never touches mac.entitlements/entitlementsInherit in that
// case. Without any signature, Apple Silicon Macs still ad-hoc-sign the
// arm64 binary at first launch, but with no entitlements at all, which
// makes V8 crash immediately (no JIT / no unsigned executable memory).
// This hook force-signs the packaged .app ad-hoc ("-") with our
// entitlements so V8 can actually run, independent of whether a real
// certificate is ever configured.
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

exports.default = async function afterSign(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appOutDir = context.appOutDir;
  const appName = fs.readdirSync(appOutDir).find((f) => f.endsWith(".app"));
  if (!appName) {
    throw new Error(`afterSignAdhoc: no .app bundle found in ${appOutDir}`);
  }
  const appPath = path.join(appOutDir, appName);
  const entitlements = path.join(__dirname, "..", "resources", "entitlements.mac.plist");

  // --options runtime is what actually turns on the Hardened Runtime for
  // the signature - without it, --entitlements is embedded as inert data
  // and the com.apple.security.cs.* keys have no effect at all, which is
  // why an earlier version of this hook (ad-hoc sign without this flag)
  // still crashed identically despite "signing" successfully.
  execFileSync(
    "codesign",
    [
      "--force",
      "--deep",
      "--options",
      "runtime",
      "--sign",
      "-",
      "--entitlements",
      entitlements,
      appPath,
    ],
    { stdio: "inherit" },
  );

  // Print the resulting signature to the CI log so a broken entitlements/
  // runtime-flag regression shows up here instead of only surfacing as a
  // crash report from a real Mac days later.
  execFileSync("codesign", ["-dvvv", "--entitlements", "-", appPath], { stdio: "inherit" });
};
