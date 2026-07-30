import type { Config } from "tailwindcss";
import sharedPreset from "@woodaa/config/tailwind-preset";

const config: Config = {
  presets: [sharedPreset as Config],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
};

export default config;
