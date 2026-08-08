import Link from "next/link";
import type { ReactNode } from "react";
import {
  BellIcon,
  CalendarIcon,
  ChevronRightIcon,
  DownloadIcon,
  HeartPulseIcon,
  HelpCircleIcon,
  LockIcon,
  PersonIcon,
  ShieldIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/account/icons";

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

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-semibold text-brand-text-muted">{title}</h2>
      <div className="rounded-brand-lg border border-brand-border bg-brand-surface">
        {items.map((item) => (
          <MenuRow key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}

export function AccountMenu({ role }: { role: "SUCHENDE" | "BETREIBER" | "ADMIN" }) {
  const kontoItems: MenuItem[] = [
    { href: "/konto/persoenliche-angaben", label: "Persönliche Angaben", icon: <PersonIcon /> },
    ...(role !== "ADMIN"
      ? [{ href: "/konto/sicherheit", label: "Sicherheitseinstellungen", icon: <LockIcon /> }]
      : []),
    ...(role !== "ADMIN"
      ? [{ href: "/konto/konto-loeschen", label: "Konto löschen", icon: <TrashIcon /> }]
      : []),
  ];

  const buchungenItems: MenuItem[] =
    role === "SUCHENDE"
      ? [
          { href: "/konto/buchungen", label: "Meine Buchungen", icon: <CalendarIcon /> },
          { href: "/konto/pflegeleistungen", label: "Pflegeleistungen", icon: <HeartPulseIcon /> },
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

  const rechtlichesItems: MenuItem[] = [
    { href: "/konto/meine-daten", label: "Meine Daten exportieren", icon: <DownloadIcon /> },
    { href: "/datenschutz", label: "Datenschutz", icon: <ShieldIcon /> },
    { href: "/nutzungsbedingungen", label: "Nutzungsbedingungen", icon: <ShieldIcon /> },
    { href: "/impressum", label: "Impressum", icon: <ShieldIcon /> },
  ];

  return (
    <div>
      <MenuSection title="Konto verwalten" items={kontoItems} />
      <MenuSection title="Meine Buchungen & Pflege" items={buchungenItems} />
      <MenuSection title="Hilfe" items={hilfeItems} />
      <MenuSection title="Rechtliches und Datenschutz" items={rechtlichesItems} />
    </div>
  );
}
