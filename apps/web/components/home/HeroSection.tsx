"use client";

import { useTranslations } from "@/lib/i18n/LocaleProvider";
import { SearchForm } from "@/components/search/SearchForm";

export function HeroSection({
  facilityCount,
  cityCount,
}: {
  facilityCount: number;
  cityCount: number;
}) {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden bg-brand-primary-dark px-6 py-20 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, #8BA888 0%, transparent 35%), radial-gradient(circle at 85% 15%, #2F7D4F 0%, transparent 40%), radial-gradient(circle at 50% 90%, #A3C77A 0%, transparent 45%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-brand-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/90">
          {t("badge")}
        </span>
        <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">{t("heroTitle")}</h1>
        <p className="mt-4 text-lg text-white/80">{t("heroSubtitle")}</p>
      </div>

      <SearchForm
        showRadius
        className="relative mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-brand-lg bg-brand-surface p-4 shadow-lg sm:flex-row"
      />

      <div className="relative mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/70">
        <span>
          <strong className="text-white">{facilityCount}</strong> {t("statsFacilitiesLabel")}
        </span>
        <span>
          <strong className="text-white">{cityCount}</strong> {t("statsCitiesLabel")}
        </span>
        <span>
          <strong className="text-white">4</strong> {t("statsBookingTypesLabel")}
        </span>
        <span>{t("statsInstantBooking")}</span>
      </div>
    </section>
  );
}
