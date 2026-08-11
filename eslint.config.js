// @ts-check
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

/**
 * Single flat-config ESLint setup for the whole monorepo. ESLint resolves
 * this file by walking up from whichever package `eslint .` runs in, so no
 * package needs its own config or a dependency on a shared config package.
 */
module.exports = tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/dist-electron/**",
      "**/out/**",
      "**/release/**",
      "**/.next/**",
      "**/.expo/**",
      "**/node_modules/**",
      "**/generated/**",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        // ignoreRestSiblings: destructuring-to-omit (const { secret, ...rest
        // } = obj) is idiomatic for stripping fields before returning an
        // object - `secret` being unused is the point, not a mistake.
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Node-executed config files (Babel/Metro/Tailwind configs, ...): plain
    // CommonJS, not part of any app's TypeScript program.
    files: [
      "**/*.config.js",
      "**/*.config.ts",
      "**/*.config.mjs",
      "**/*.cjs",
      "babel.config.js",
      "metro.config.js",
    ],
    languageOptions: {
      globals: {
        module: "readonly",
        exports: "writable",
        require: "readonly",
        __dirname: "readonly",
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
