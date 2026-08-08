import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

// Uses electron-vite's default output layout (out/main, out/preload,
// out/renderer) rather than custom paths - keeps main.ts's dev/prod URL
// resolution matching electron-vite's own documented convention
// (process.env.ELECTRON_RENDERER_URL) instead of inventing our own.
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: { rollupOptions: { input: "./electron/main.ts" } },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: { rollupOptions: { input: "./electron/preload.ts" } },
  },
  renderer: {
    root: ".",
    plugins: [react()],
    build: {
      rollupOptions: { input: "index.html" },
    },
  },
});
