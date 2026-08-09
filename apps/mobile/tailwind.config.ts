import type { Config } from "tailwindcss";
import sharedPreset from "@woodaa/config/tailwind-preset";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset"), sharedPreset as Config],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Mirrors apps/web/tailwind.config.ts's dark palette (see
        // apps/web/app/globals.css .dark block for the same hex values).
        // NativeWind can't resolve CSS custom properties like the web
        // app's var(--brand-*) trick, so these are separate `dark:`-suffixed
        // utilities (e.g. `bg-brand-background dark:bg-brand-background-dark`)
        // applied per-usage instead.
        brand: {
          "background-dark": "#16210f",
          "surface-dark": "#223018",
          "text-dark": "#f3f5ee",
          "text-muted-dark": "#b7c2a8",
          "border-dark": "#37472a",
          "heading-dark": "#ffffff",
        },
      },
    },
  },
};

export default config;
