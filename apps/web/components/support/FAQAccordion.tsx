import { faqByLocale, type FaqEntry } from "@/lib/i18n/faqData";
import { getServerLocale, getServerTranslations } from "@/lib/i18n/server";

function FAQList({ faqs }: { faqs: FaqEntry[] }) {
  return (
    <div className="flex flex-col gap-2">
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className="rounded-brand-md border border-brand-border bg-brand-surface p-4"
        >
          <summary className="cursor-pointer font-medium text-brand-text">{faq.question}</summary>
          <p className="mt-2 text-sm text-brand-text-muted">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export async function FAQAccordion() {
  const locale = await getServerLocale();
  const t = await getServerTranslations("hilfe");
  const { userFaqs, facilityFaqs } = faqByLocale[locale];

  return (
    <div id="faq" className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text-muted">
          {t("faqUserGroupTitle")}
        </h3>
        <FAQList faqs={userFaqs} />
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text-muted">
          {t("faqFacilityGroupTitle")}
        </h3>
        <FAQList faqs={facilityFaqs} />
      </div>
    </div>
  );
}
