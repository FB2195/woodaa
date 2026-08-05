"use client";

import { useTranslations } from "@/lib/i18n/LocaleProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");

  return (
    <label className="flex items-center gap-2 px-2 py-2 text-sm text-brand-text-muted">
      {t("label")}
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value as "light" | "dark")}
        className="rounded-brand-md border border-brand-border px-2 py-1 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
      >
        <option value="light">{t("light")}</option>
        <option value="dark">{t("dark")}</option>
      </select>
    </label>
  );
}
