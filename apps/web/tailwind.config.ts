import type { Config } from "tailwindcss";
import sharedPreset from "@woodaa/config/tailwind-preset";

const config: Config = {
  presets: [sharedPreset as Config],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Web-only dark mode layer: redefines the theme-dependent brand
        // colors as CSS custom properties (values in app/globals.css,
        // swapped via the .dark class) on top of the shared preset's
        // literal hex values. Deep-merges over sharedPreset's `brand`
        // object, so primary/primary-dark/accent stay the shared preset's
        // fixed hex - only these keys become theme-aware. Scoped to
        // apps/web because NativeWind (apps/mobile) can't resolve var().
        brand: {
          background: "var(--brand-background)",
          surface: "var(--brand-surface)",
          text: "var(--brand-text)",
          "text-muted": "var(--brand-text-muted)",
          border: "var(--brand-border)",
          heading: "var(--brand-heading)",
        },
      },
    },
  },
};

export default config;
