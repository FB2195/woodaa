import { Header } from "@/components/Header";
import { AIChatWidget } from "@/components/support/AIChatWidget";
import { FAQAccordion } from "@/components/support/FAQAccordion";
import { OperatorSupportChannels } from "@/components/support/OperatorSupportChannels";
import { SupportRequestForm } from "@/components/support/SupportRequestForm";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function KundenservicePage() {
  const t = await getServerTranslations("hilfe");
  const tHeader = await getServerTranslations("header");

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">{tHeader("customerService")}</h1>
        <p className="mt-2 text-brand-text-muted">{t("kundenserviceIntro")}</p>

        <h2 className="mt-10 text-lg font-semibold text-brand-text">{t("faqSectionTitle")}</h2>
        <div className="mt-4">
          <FAQAccordion />
        </div>

        <h2 className="mt-10 text-lg font-semibold text-brand-text">{t("phoneSectionTitle")}</h2>
        <div className="mt-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
          <p className="text-brand-text">
            {/* Platzhalter - vor Live-Gang durch echte Hotline-Nummer ersetzen */}
            {t("phonePlaceholder")}
          </p>
          <p className="mt-2 text-sm text-brand-text-muted">{t("phoneCallbackHint")}</p>
        </div>

        <h2 className="mt-10 text-lg font-semibold text-brand-text">{t("aiChatSectionTitle")}</h2>
        <p className="mt-1 text-sm text-brand-text-muted">{t("aiChatSectionText")}</p>
        <div className="mt-4">
          <AIChatWidget />
        </div>

        <h2 className="mt-10 text-lg font-semibold text-brand-text">{t("callbackSectionTitle")}</h2>
        <p className="mt-1 text-sm text-brand-text-muted">{t("callbackSectionText")}</p>
        <div className="mt-4">
          <SupportRequestForm
            type="RUECKRUF"
            submitLabel={t("callbackSubmitLabel")}
            phoneRequired
          />
        </div>

        <h2 className="mt-10 text-lg font-semibold text-brand-text">{t("messageSectionTitle")}</h2>
        <p className="mt-1 text-sm text-brand-text-muted">{t("messageSectionText")}</p>
        <div className="mt-4">
          <SupportRequestForm type="KONTAKT" submitLabel={t("messageSubmitLabel")} />
        </div>

        <OperatorSupportChannels />
      </section>
    </main>
  );
}
