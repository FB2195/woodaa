"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { messagesByLocale } from "./messages";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale, type Messages } from "./types";

const LOCALE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

function readLocaleCookie(): Locale | null {
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${LOCALE_COOKIE}=`));
  const value = match?.split("=")[1];
  return value && isLocale(value) ? value : null;
}

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

// Cookie-based rather than URL-prefixed (no /en/, /tr/, ... route segments) -
// avoids restructuring every existing route under a [locale] segment.
// Starts at DEFAULT_LOCALE (de) for a hydration-safe first paint, then
// switches to the stored preference right after mount.
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readLocaleCookie();
    if (stored && stored !== DEFAULT_LOCALE) setLocaleState(stored);
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_MAX_AGE_SECONDS}; SameSite=Lax`;
  }

  return (
    <LocaleContext.Provider value={{ locale, messages: messagesByLocale[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

export function useTranslations<K extends keyof Messages>(namespace: K) {
  const { messages } = useLocale();
  const ns = messages[namespace];
  return function t(key: keyof Messages[K], vars?: Record<string, string | number>): string {
    let text = String(ns[key]);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}
