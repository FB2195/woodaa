import { cookies } from "next/headers";
import { messagesByLocale } from "./messages";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale, type Messages } from "./types";

// Server Component counterpart to useLocale()/useTranslations() - those
// read the locale from React context, which doesn't exist on the server.
// Same cookie, read directly instead.
export async function getServerLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getServerTranslations<K extends keyof Messages>(namespace: K) {
  const locale = await getServerLocale();
  const ns = messagesByLocale[locale][namespace];
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
