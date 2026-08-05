"use client";

import { useLocale, useTranslations } from "@/lib/i18n/LocaleProvider";
import { SUPPORTED_LOCALES } from "@/lib/i18n/types";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations("language");
  const tHeader = useTranslations("header");

  return (
    <label className="flex items-center gap-2 px-2 py-2 text-sm text-brand-text-muted">
      {tHeader("language")}
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as (typeof SUPPORTED_LOCALES)[number])}
        className="rounded-brand-md border border-brand-border px-2 py-1 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
