import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  BellIcon,
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
import { appStoreUrlFor, detectAppPlatform } from "@/lib/appStoreLinks";

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

export async function AccountMenu({ role }: { role: "SUCHENDE" | "BETREIBER" | "ADMIN" }) {
  const userAgent = (await headers()).get("user-agent") ?? "";
  const appDownloadUrl = appStoreUrlFor(detectAppPlatform(userAgent));

  const kontoItems: MenuItem[] = [
    { href: "/konto/persoenliche-angaben", label: "Persönliche Angaben", icon: <PersonIcon /> },
    ...(role !== "ADMIN"
      ? [{ href: "/konto/sicherheit", label: "Sicherheitseinstellungen", icon: <LockIcon /> }]
      : []),
    { href: "/konto/meine-daten", label: "Meine Daten exportieren", icon: <DownloadIcon /> },
    ...(role !== "ADMIN"
      ? [{ href: "/konto/konto-loeschen", label: "Konto löschen", icon: <TrashIcon /> }]
      : []),
  ];

  const buchungenItems: MenuItem[] =
    role === "SUCHENDE"
      ? [
          { href: "/konto/buchungen", label: "Meine Buchungen", icon: <CalendarIcon /> },
          {
            href: "/konto/pflegeleistungen",
            label: "Pflegeleistungen beantragen",
            icon: <HeartPulseIcon />,
          },
          {
            href: "/konto/bevollmaechtigung",
            label: "Bevollmächtigte/r Angehörige/r",
            icon: <UsersIcon />,
          },
          {
            href: "/konto/gespeicherte-suchen",
            label: "Gespeicherte Suchen",
            icon: <BellIcon />,
          },
        ]
      : [];

  const hilfeItems: MenuItem[] = [
    { href: "/hilfe/kundenservice", label: "Kundenservice", icon: <HelpCircleIcon /> },
    { href: "/hilfe", label: "Hilfe & FAQ", icon: <HelpCircleIcon /> },
    { href: "/fehler-melden", label: "Fehler/Problem melden", icon: <HelpCircleIcon /> },
  ];

  // Betreiber sind bereits registriert, ADMIN braucht den Werbe-Link nicht -
  // "Unterkunft anmelden" ist ein Upsell nur für Suchende, wie bei Booking.
  const mehrItems: MenuItem[] = [
    { href: appDownloadUrl, label: "App herunterladen", icon: <SmartphoneIcon /> },
    ...(role === "SUCHENDE"
      ? [{ href: "/betreiber/registrieren", label: "Unterkunft anmelden", icon: <HomeIcon /> }]
      : []),
  ];

  const rechtlichesItems: MenuItem[] = [
    { href: "/datenschutz", label: "Datenschutz", icon: <ShieldIcon /> },
    { href: "/nutzungsbedingungen", label: "Nutzungsbedingungen", icon: <ShieldIcon /> },
    { href: "/impressum", label: "Impressum", icon: <ShieldIcon /> },
  ];

  return (
    <div>
      <MenuSection title="Konto verwalten" items={kontoItems} />
      <MenuSection title="Meine Buchungen & Pflege" items={buchungenItems} />
      <MenuSection title="Hilfe" items={hilfeItems} />
      <MenuSection
        title="Mehr"
        items={mehrItems}
        extra={
          <div className="flex items-center justify-between gap-3 border-b border-brand-border px-4 py-4">
            <span className="flex items-center gap-3 text-sm font-medium text-brand-text">
              <span className="text-brand-text-muted">
                <GlobeIcon />
              </span>
              Sprache
            </span>
            <LanguageSwitcher bare />
          </div>
        }
      />
      <MenuSection title="Rechtliches und Datenschutz" items={rechtlichesItems} />
    </div>
  );
}
