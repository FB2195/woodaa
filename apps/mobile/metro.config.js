const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Allow Metro to resolve workspace packages (@woodaa/*) from the monorepo root.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Required for pnpm: node_modules is symlinked and packages (e.g.
// react-native-css-interop, used by NativeWind) resolve via "exports" maps.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// With watchFolders including the monorepo root, Metro can otherwise resolve
// two separate copies of react/react-dom/react-native from different
// dependency subtrees (this app pins react@18.2.0, apps/web pins
// ^18.3.1, and pnpm's per-package node_modules lets a transitive
// dependency pull in the other one). Two React copies means hooks called
// against one copy see a null dispatcher from the other, crashing with
// "Cannot read property 'useMemo' of null" deep inside expo-router - force
// every resolution of these to this app's own copy.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
