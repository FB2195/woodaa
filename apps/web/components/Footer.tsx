"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/i18n/LocaleProvider";

export function Footer() {
  const t = useTranslations("footer");
  const tHeader = useTranslations("header");

  const columns = [
    {
      heading: t("brandColumn"),
      links: [
        { href: "/ueber-uns", label: tHeader("aboutUs") },
        { href: "/betreiber/registrieren", label: tHeader("registerFacility") },
      ],
    },
    {
      heading: t("helpColumn"),
      links: [
        { href: "/hilfe", label: tHeader("helpSupport") },
        { href: "/hilfe/kundenservice", label: tHeader("customerService") },
        { href: "/hilfe/kundenservice#faq", label: t("faq") },
        { href: "/fehler-melden", label: tHeader("reportIssue") },
      ],
    },
    {
      heading: t("legalColumn"),
      links: [
        { href: "/datenschutz", label: tHeader("privacy") },
        { href: "/impressum", label: tHeader("imprint") },
        { href: "/cookie-einstellungen", label: tHeader("cookieInfo") },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-brand-border bg-brand-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3">
        {columns.map((column) => (
          <div key={column.heading}>
            <h3 className="text-sm font-semibold text-brand-primary-dark">{column.heading}</h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-brand-text-muted">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand-text">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-brand-border px-6 py-4 text-center text-xs text-brand-text-muted">
        {t("copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
