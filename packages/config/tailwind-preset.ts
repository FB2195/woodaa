import type { Config } from "tailwindcss";
import { colors, radii } from "@woodaa/ui";

/**
 * Shared Tailwind preset consumed by both apps/web (Tailwind CSS) and
 * apps/mobile (NativeWind), so both clients render the same brand tokens.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: colors.primary,
          "primary-dark": colors.primaryDark,
          accent: colors.accent,
          background: colors.background,
          surface: colors.surface,
          text: colors.text,
          "text-muted": colors.textMuted,
          border: colors.border,
        },
      },
      borderRadius: {
        "brand-sm": radii.sm,
        "brand-md": radii.md,
        "brand-lg": radii.lg,
        "brand-full": radii.full,
      },
    },
  },
};

export default preset;
