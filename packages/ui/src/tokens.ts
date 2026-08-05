/**
 * woodaa brand tokens — green-forward palette (grün / olivgrün).
 * Single source of truth, consumed by the web (Tailwind) and mobile
 * (NativeWind) tailwind presets so both clients render the same brand.
 * background/surface/surfaceAlt are all green-tinted on purpose (previously
 * near-white/pure-white, then a lighter sage that still read as too pale) -
 * the brand's dark green (primaryDark) anchors the palette, but should read
 * through the rest of the page too instead of sitting on stark white. All
 * pairings checked against WCAG AA (>=4.5:1 for text/textMuted, >=3:1 for
 * large text) against every surface tone.
 */
export const colors = {
  primary: "#5B6B3F", // olive green — primary brand color
  primaryDark: "#3E4A2B", // hero/CTA sections, headers, hover/pressed states
  accent: "#2F7D4F", // fresh green — CTAs, price highlights
  background: "#C9D9B4", // medium sage green — page background
  surface: "#DCE8C9", // lighter sage — cards/panels, lifted above background
  surfaceAlt: "#AFC494", // deeper sage — banded/alternating section backgrounds
  text: "#1F2A1A",
  textMuted: "#3F4636",
  border: "#96AC7C",
} as const;

export const radii = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  full: "9999px",
} as const;

export type BrandColor = keyof typeof colors;
