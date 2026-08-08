import type { Config } from "tailwindcss";
import sharedPreset from "@woodaa/config/tailwind-preset";

/**
 * Desktop-only design layer on top of the shared woodaa brand preset - a
 * calmer, more spacious "professional tool" palette (neutral surface
 * layers, tinted elevation, a refined accent scale) rather than reusing
 * apps/web's dashboard styling directly. Scoped to apps/desktop so it
 * doesn't leak into web/mobile.
 */
const config: Config = {
  presets: [sharedPreset as Config],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter Variable",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        canvas: {
          DEFAULT: "#F7F6F2",
          panel: "#FFFFFF",
          raised: "#FFFFFF",
        },
        ink: {
          900: "#1B2118",
          700: "#3A4232",
          500: "#5B6355",
          400: "#7C8474",
          300: "#A5AB9C",
        },
        hairline: {
          DEFAULT: "#E7E5DD",
          strong: "#D7D4C8",
        },
        accentScale: {
          50: "#EBF5EF",
          100: "#D3E9DC",
          500: "#2F7D4F",
          600: "#276841",
          700: "#1F5334",
        },
      },
      borderRadius: {
        xl2: "20px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(27, 33, 24, 0.04)",
        sm: "0 1px 3px 0 rgba(27, 33, 24, 0.06), 0 1px 2px -1px rgba(27, 33, 24, 0.05)",
        md: "0 4px 12px -2px rgba(27, 33, 24, 0.08), 0 2px 4px -2px rgba(27, 33, 24, 0.05)",
        lg: "0 12px 24px -6px rgba(27, 33, 24, 0.10), 0 4px 8px -4px rgba(27, 33, 24, 0.06)",
      },
      transitionTimingFunction: {
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
      transitionDuration: {
        250: "250ms",
      },
    },
  },
};

export default config;
