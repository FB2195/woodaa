import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  BellIcon,
  CalculatorIcon,
  CalendarIcon,
  ChevronRightIcon,
  DownloadIcon,
  GlobeIcon,
  HeartPulseIcon,
  HelpCircleIcon,
  HomeIcon,
  LockIcon,
  PersonIcon,
  ShieldIcon,
  SmartphoneIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/account/icons";
import { LogoutMenuRow } from "@/components/account/LogoutMenuRow";
import { appStoreUrlFor, detectAppPlatform } from "@/lib/appStoreLinks";
import { getServerTranslations } from "@/lib/i18n/server";

type MenuItem = { href: string; label: string; icon: ReactNode };

function MenuRow({ href, label, icon }: MenuItem) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 border-b border-brand-border px-4 py-4 last:border-b-0 hover:bg-brand-background"
    >
      <span className="flex items-center gap-3 text-sm font-medium text-brand-text">
        <span className="text-brand-text-muted">{icon}</span>
        {label}
      </span>
      <span className="text-brand-text-muted">
        <ChevronRightIcon />
      </span>
    </Link>
  );
}

function MenuSection({
  title,
  items,
  extra,
}: {
  title: string;
  items: MenuItem[];
  extra?: ReactNode;
}) {
  if (items.length === 0 && !extra) return null;
  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-semibold text-brand-text-muted">{title}</h2>
      <div className="rounded-brand-lg border border-brand-border bg-brand-surface">
        {extra}
        {items.map((item) => (
          <MenuRow key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}

export async function AccountMenu({
  role,
}: {
  role: "SUCHENDE" | "BETREIBER" | "MITARBEITER" | "ADMIN";
}) {
  const userAgent = (await headers()).get("user-agent") ?? "";
  const appDownloadUrl = appStoreUrlFor(detectAppPlatform(userAgent));
  const t = await getServerTranslations("account");
  const tHeader = await getServerTranslations("header");

  const kontoItems: MenuItem[] = [
    { href: "/konto/persoenliche-angaben", label: t("personalData"), icon: <PersonIcon /> },
    ...(role !== "ADMIN"
      ? [{ href: "/konto/sicherheit", label: t("securitySettings"), icon: <LockIcon /> }]
      : []),
    { href: "/konto/meine-daten", label: t("exportData"), icon: <DownloadIcon /> },
    ...(role !== "ADMIN"
      ? [{ href: "/konto/konto-loeschen", label: t("deleteAccount"), icon: <TrashIcon /> }]
      : []),
  ];

  const buchungenItems: MenuItem[] =
    role === "SUCHENDE"
      ? [
          { href: "/konto/buchungen", label: t("myBookings"), icon: <CalendarIcon /> },
          {
            href: "/konto/pflegeleistungen",
            label: t("requestCareBenefits"),
            icon: <HeartPulseIcon />,
          },
          {
            href: "/pflegeleistungen-berechnen",
            label: tHeader("calculateCareBenefits"),
            icon: <CalculatorIcon />,
          },
          {
            href: "/konto/bevollmaechtigung",
            label: t("authorizedRepresentative"),
            icon: <UsersIcon />,
          },
          {
            href: "/konto/gespeicherte-suchen",
            label: t("savedSearches"),
            icon: <BellIcon />,
          },
        ]
      : [];

  // Kein eigener "Kundenservice"-Punkt mehr - "Hilfe & FAQ" verlinkt ohnehin
  // dorthin, ein separater Eintrag war redundant.
  const hilfeItems: MenuItem[] = [
    { href: "/hilfe", label: t("helpFaq"), icon: <HelpCircleIcon /> },
    { href: "/fehler-melden", label: tHeader("reportIssue"), icon: <HelpCircleIcon /> },
  ];

  // Betreiber sind bereits registriert, ADMIN braucht den Werbe-Link nicht -
  // "Unterkunft anmelden" ist ein Upsell nur für Suchende, wie bei Booking.
  // Führt zunächst auf die business.woodaa.de-Hauptseite (Betreiber-Login,
  // siehe middleware.ts) statt direkt ins Registrierungsformular.
  const mehrItems: MenuItem[] = [
    { href: appDownloadUrl, label: t("downloadApp"), icon: <SmartphoneIcon /> },
    ...(role === "SUCHENDE"
      ? [{ href: "/betreiber/login", label: t("registerFacility"), icon: <HomeIcon /> }]
      : []),
  ];

  const rechtlichesItems: MenuItem[] = [
    { href: "/datenschutz", label: tHeader("privacy"), icon: <ShieldIcon /> },
    { href: "/nutzungsbedingungen", label: t("termsOfService"), icon: <ShieldIcon /> },
    { href: "/impressum", label: tHeader("imprint"), icon: <ShieldIcon /> },
  ];

  return (
    <div>
      <MenuSection title={t("manageAccount")} items={kontoItems} />
      <MenuSection title={t("bookingsAndCare")} items={buchungenItems} />
      <MenuSection title={t("help")} items={hilfeItems} />
      <MenuSection
        title={t("more")}
        items={mehrItems}
        extra={
          <div className="flex items-center justify-between gap-3 border-b border-brand-border px-4 py-4">
            <span className="flex items-center gap-3 text-sm font-medium text-brand-text">
              <span className="text-brand-text-muted">
                <GlobeIcon />
              </span>
              {t("language")}
            </span>
            <LanguageSwitcher bare />
          </div>
        }
      />
      <MenuSection title={t("legalAndPrivacy")} items={rechtlichesItems} />

      <div className="mt-8 rounded-brand-lg border border-brand-border bg-brand-surface">
        <LogoutMenuRow label={t("logout")} loadingLabel={t("loggingOut")} />
      </div>
    </div>
  );
}
