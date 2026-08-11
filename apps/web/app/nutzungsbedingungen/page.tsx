import { Header } from "@/components/Header";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NutzungsbedingungenPage() {
  const t = await getServerTranslations("nutzungsbedingungen");

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">{t("title")}</h1>
        <p className="mt-2 text-sm text-brand-text-muted">{t("intro")}</p>

        <div className="mt-8 flex flex-col gap-6 text-brand-text">
          <div>
            <h2 className="font-semibold text-brand-heading">{t("descriptionTitle")}</h2>
            <p className="mt-1 text-sm">{t("descriptionBody")}</p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">{t("registrationTitle")}</h2>
            <p className="mt-1 text-sm">{t("registrationBody")}</p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">{t("bookingsTitle")}</h2>
            <p className="mt-1 text-sm">{t("bookingsBody")}</p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">{t("facilityDutiesTitle")}</h2>
            <p className="mt-1 text-sm">{t("facilityDutiesBody")}</p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">{t("liabilityTitle")}</h2>
            <p className="mt-1 text-sm">{t("liabilityBody")}</p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">{t("changesTitle")}</h2>
            <p className="mt-1 text-sm">{t("changesBody")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
