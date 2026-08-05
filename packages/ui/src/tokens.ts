/**
 * woodaa brand tokens — green-forward palette (grün / olivgrün).
 * Single source of truth, consumed by the web (Tailwind) and mobile
 * (NativeWind) tailwind presets so both clients render the same brand.
 * background/surface/surfaceAlt are all green-tinted on purpose (previously
 * near-white/pure-white) - the brand's dark green (primaryDark) anchors the
 * palette, but should read through the rest of the page too instead of
 * sitting on stark white. All pairings checked against WCAG AA (>=4.5:1
 * for text/textMuted, >=3:1 for large text) against every surface tone.
 */
export const colors = {
  primary: "#5B6B3F", // olive green — primary brand color
  primaryDark: "#3E4A2B", // hero/CTA sections, headers, hover/pressed states
  accent: "#2F7D4F", // fresh green — CTAs, price highlights
  background: "#E8EFDF", // soft sage green — page background
  surface: "#F4F8EE", // paler mint — cards/panels, lifted above background
  surfaceAlt: "#D7E4C7", // deeper sage — banded/alternating section backgrounds
  text: "#1F2A1A",
  textMuted: "#565F4C",
  border: "#C3D4AE",
} as const;

export const radii = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  full: "9999px",
} as const;

export type BrandColor = keyof typeof colors;
