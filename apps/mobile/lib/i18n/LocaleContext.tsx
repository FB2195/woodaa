import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { messagesByLocale } from "./messages";
import { DEFAULT_LOCALE, isLocale, type Locale, type Messages } from "./types";

const LOCALE_KEY = "woodaa.locale";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

// Mobile port of apps/web/lib/i18n/LocaleProvider.tsx - SecureStore instead
// of a cookie (same persistence mechanism already used for the theme
// preference, see lib/themeStore.ts), otherwise the same "start at
// DEFAULT_LOCALE, switch to the stored preference right after mount" shape.
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    SecureStore.getItemAsync(LOCALE_KEY).then((stored) => {
      if (stored && isLocale(stored) && stored !== DEFAULT_LOCALE) {
        setLocaleState(stored);
      }
    });
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    void SecureStore.setItemAsync(LOCALE_KEY, next);
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
