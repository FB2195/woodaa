import { colorScheme } from "nativewind";
import { Appearance } from "react-native";
import * as SecureStore from "expo-secure-store";

export type Theme = "light" | "dark";

const THEME_KEY = "woodaa.theme";

// Mirrors apps/web's THEME_COOKIE behavior: an explicit user choice is
// persisted and always wins; absent that, fall back to the OS preference
// (same "stored ?? system preference" logic as
// apps/web/lib/theme/ThemeProvider.tsx).
export async function loadInitialTheme(): Promise<Theme> {
  const stored = await SecureStore.getItemAsync(THEME_KEY);
  const theme: Theme =
    stored === "light" || stored === "dark"
      ? stored
      : (Appearance.getColorScheme() ?? "light");
  colorScheme.set(theme);
  return theme;
}

export async function setTheme(theme: Theme): Promise<void> {
  colorScheme.set(theme);
  await SecureStore.setItemAsync(THEME_KEY, theme);
}
