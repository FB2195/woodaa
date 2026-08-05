/**
 * woodaa brand tokens — white/off-white base with dark green accents.
 * Single source of truth, consumed by the web (Tailwind) and mobile
 * (NativeWind) tailwind presets so both clients render the same brand.
 * apps/web layers a theme-aware dark mode on top of these (see
 * apps/web/tailwind.config.ts and apps/web/app/globals.css) - these values
 * remain the light-mode/mobile palette.
 */
export const colors = {
  primary: "#5B6B3F", // olive green — primary brand color
  primaryDark: "#3E4A2B", // hover/pressed states, headers
  accent: "#2F7D4F", // fresh green — CTAs, price highlights
  background: "#FAF9F5", // warm off-white
  surface: "#FFFFFF",
  text: "#1F2A1A",
  textMuted: "#6B6F62",
  border: "#E4E2D8",
} as const;

export const radii = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  full: "9999px",
} as const;

export type BrandColor = keyof typeof colors;
