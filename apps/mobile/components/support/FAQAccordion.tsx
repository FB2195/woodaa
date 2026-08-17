import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { faqByLocale, type FaqEntry } from "@/lib/i18n/faqData";
import { useLocale, useTranslations } from "@/lib/i18n/LocaleContext";

// Same expand/collapse convention as FacilityPolicyLinks.tsx's PolicyRow -
// RN has no <details>/<summary> equivalent.
function FAQRow({ faq }: { faq: FaqEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="rounded-brand-md border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between gap-2"
      >
        <Text className="flex-1 font-medium text-brand-text dark:text-brand-text-dark">
          {faq.question}
        </Text>
        <Text className="text-brand-text-muted dark:text-brand-text-muted-dark">
          {open ? "▲" : "▼"}
        </Text>
      </Pressable>
      {open && (
        <Text className="mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          {faq.answer}
        </Text>
      )}
    </View>
  );
}

function FAQList({ faqs }: { faqs: FaqEntry[] }) {
  return (
    <View className="gap-2">
      {faqs.map((faq) => (
        <FAQRow key={faq.question} faq={faq} />
      ))}
    </View>
  );
}

// Mobile port of apps/web/components/support/FAQAccordion.tsx.
export function FAQAccordion() {
  const { locale } = useLocale();
  const t = useTranslations("hilfe");
  const { userFaqs, facilityFaqs } = faqByLocale[locale];

  return (
    <View className="gap-6">
      <View>
        <Text className="mb-3 text-sm font-semibold uppercase text-brand-text-muted dark:text-brand-text-muted-dark">
          {t("faqUserGroupTitle")}
        </Text>
        <FAQList faqs={userFaqs} />
      </View>
      <View>
        <Text className="mb-3 text-sm font-semibold uppercase text-brand-text-muted dark:text-brand-text-muted-dark">
          {t("faqFacilityGroupTitle")}
        </Text>
        <FAQList faqs={facilityFaqs} />
      </View>
    </View>
  );
}
