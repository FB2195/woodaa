"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/i18n/LocaleProvider";

const trustPoints = [
  { icon: "⚡", titleKey: "trust1Title", textKey: "trust1Text" },
  { icon: "🔒", titleKey: "trust2Title", textKey: "trust2Text" },
  { icon: "✅", titleKey: "trust3Title", textKey: "trust3Text" },
  { icon: "🤝", titleKey: "trust4Title", textKey: "trust4Text" },
] as const;

const steps = [
  { icon: "🔍", labelKey: "step1Label", titleKey: "step1Title", textKey: "step1Text" },
  { icon: "✅", labelKey: "step2Label", titleKey: "step2Title", textKey: "step2Text" },
  { icon: "🤝", labelKey: "step3Label", titleKey: "step3Title", textKey: "step3Text" },
] as const;

export function WhySection() {
  const t = useTranslations("home");

  return (
    <section className="border-b border-brand-border bg-brand-surface px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold text-brand-text">{t("whyTitle")}</h2>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
          {trustPoints.map((point) => (
            <div
              key={point.titleKey}
              className="w-64 shrink-0 rounded-brand-lg border border-brand-border bg-brand-surface p-5 shadow-sm"
            >
              <span className="text-3xl">{point.icon}</span>
              <h3 className="mt-3 text-base font-semibold text-brand-heading">
                {t(point.titleKey)}
              </h3>
              <p className="mt-2 text-sm text-brand-text-muted">{t(point.textKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const t = useTranslations("home");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-2xl font-semibold text-brand-text">{t("howItWorksTitle")}</h2>
      <div className="mt-8 grid gap-8 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.titleKey} className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-brand-full bg-brand-accent/10 text-2xl">
              {step.icon}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-accent">
              {t(step.labelKey)}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-brand-heading">
              {t(step.titleKey)}
            </h3>
            <p className="mt-2 text-sm text-brand-text-muted">{t(step.textKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function OperatorCtaSection() {
  const t = useTranslations("home");

  return (
    <section className="bg-brand-primary-dark px-6 py-14 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        <div>
          <h2 className="text-xl font-semibold">{t("operatorCta")}</h2>
          <p className="mt-1 text-white/80">{t("operatorCtaText")}</p>
        </div>
        <Link
          href="/betreiber/registrieren"
          className="shrink-0 rounded-brand-md bg-white px-6 py-3 font-semibold text-brand-primary-dark transition hover:opacity-90"
        >
          {t("operatorCtaButton")}
        </Link>
      </div>
    </section>
  );
}
