"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const THEME_COOKIE = "woodaa_theme";
const THEME_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

function readThemeCookie(): Theme | null {
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${THEME_COOKIE}=`));
  const value = match?.split("=")[1];
  return value === "light" || value === "dark" ? value : null;
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Starts at "light" for a hydration-safe first paint (matches the inline
// script in layout.tsx, which applies the real class - cookie, else
// prefers-color-scheme - before any content paints, so there's no visible
// flash even though React itself always mounts assuming "light"). Once
// mounted, re-reads the same cookie/system-preference logic to sync React
// state with whatever the inline script already applied to <html>.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = readThemeCookie();
    const initial = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setThemeState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeState(next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_MAX_AGE_SECONDS}; SameSite=Lax`;
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
