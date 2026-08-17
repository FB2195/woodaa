import { SelectField } from "@/components/SelectField";
import { useLocale, useTranslations } from "@/lib/i18n/LocaleContext";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/types";

// Mobile port of apps/web/components/LanguageSwitcher.tsx - SelectField
// instead of a native <select>, otherwise the same options list.
export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations("language");
  const tAccount = useTranslations("account");

  const options = SUPPORTED_LOCALES.map((code) => ({ value: code as Locale, label: t(code) }));

  return (
    <SelectField
      label={tAccount("language")}
      value={locale}
      options={options}
      onChange={setLocale}
    />
  );
}
