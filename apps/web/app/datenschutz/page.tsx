import { Header } from "@/components/Header";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function DatenschutzPage() {
  const t = await getServerTranslations("datenschutz");

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">{t("title")}</h1>
        <p className="mt-2 text-sm text-brand-text-muted">{t("intro")}</p>

        <div className="mt-8 flex flex-col gap-6 text-brand-text">
          <div>
            <h2 className="font-semibold text-brand-heading">{t("controllerTitle")}</h2>
            <p className="mt-1 text-sm">
              {t("controllerBody")}{" "}
              <a href="/impressum" className="underline">
                Impressum
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">{t("dataTitle")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>{t("dataAccount")}</li>
              <li>{t("dataCare")}</li>
              <li>{t("dataBooking")}</li>
              <li>{t("dataPayment")}</li>
              <li>{t("dataReviews")}</li>
              <li>{t("dataLocation")}</li>
              <li>{t("dataCookies")}</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">{t("purposeTitle")}</h2>
            <p className="mt-1 text-sm">{t("purposeBody")}</p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">{t("providersTitle")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>{t("providerStripe")}</li>
              <li>{t("providerResend")}</li>
              <li>{t("providerR2")}</li>
              <li>{t("providerMaps")}</li>
              <li>{t("providerHosting")}</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">{t("rightsTitle")}</h2>
            <p className="mt-1 text-sm">
              {t("rightsBodyPre")}{" "}
              <a href="/hilfe/kundenservice" className="underline">
                {t("rightsBodyLinkText")}
              </a>{" "}
              {t("rightsBodyPost")}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">{t("retentionTitle")}</h2>
            <p className="mt-1 text-sm">{t("retentionBody")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
