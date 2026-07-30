import type { Config } from "tailwindcss";
import sharedPreset from "@woodaa/config/tailwind-preset";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset"), sharedPreset as Config],
};

export default config;
