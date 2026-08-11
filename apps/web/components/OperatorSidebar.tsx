"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
};

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5 12 4l8 7.5" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"
      />
    </svg>
  );
}

function BedIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v2M21 18v2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 10V7a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3"
      />
      <circle cx="8" cy="8.5" r="1" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
      <path strokeLinecap="round" d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
    </svg>
  );
}

function EuroIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 6.5a6.5 6.5 0 1 0 0 11M6 10h9M6 14h7"
      />
    </svg>
  );
}

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="7" r="2.4" />
      <path strokeLinecap="round" d="M15.5 14.3c2.6.4 4.5 2.6 4.5 5.7" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 3.5 2.5 5.4 5.8.6-4.4 3.9 1.3 5.8L12 16.3l-5.2 2.9 1.3-5.8-4.4-3.9 5.8-.6L12 3.5Z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.7 7.7 0 0 0-1.7-1L15 3.5H9l-.4 2.5a7.7 7.7 0 0 0-1.7 1l-2.3-.9-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9c.5.4 1.1.75 1.7 1l.4 2.5h6l.4-2.5c.6-.25 1.2-.6 1.7-1l2.3.9 2-3.4-2-1.5Z"
      />
    </svg>
  );
}

const navItems: NavItem[] = [
  { href: "/betreiber/dashboard", label: "Übersicht", icon: HomeIcon },
  { href: "/betreiber/dashboard/belegung", label: "Belegung", icon: BedIcon },
  { href: "/betreiber/dashboard/buchungen", label: "Buchungen", icon: CalendarIcon },
  { href: "/betreiber/dashboard/zahlungen", label: "Zahlungen", icon: EuroIcon },
  { href: "/betreiber/dashboard/team", label: "Team", icon: TeamIcon },
  { href: "/betreiber/dashboard/bewertungen", label: "Bewertungen", icon: StarIcon },
  { href: "/betreiber/dashboard/einstellungen", label: "Einstellungen", icon: SettingsIcon },
];

function isActive(pathname: string, href: string): boolean {
  // "Übersicht" (the dashboard root) would otherwise match every nested
  // route too, since they all start with the same prefix.
  if (href === "/betreiber/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OperatorSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* md+: a persistent left column, wide enough to keep full text
          labels (not icon-only) - a non-technical operator should never
          have to guess what an icon means. */}
      <nav className="hidden w-52 shrink-0 flex-col gap-1 border-r border-brand-border bg-brand-surface px-3 py-6 md:flex">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-brand-accent text-white" : "text-brand-text hover:bg-brand-background"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Below md (phones): a horizontally scrollable tab strip instead of
          a hidden drawer - no extra open/close state to get wrong, and
          every section stays one tap away and visible without a menu
          toggle to discover first. */}
      <nav className="flex gap-1 overflow-x-auto border-b border-brand-border bg-brand-surface px-3 py-2 md:hidden">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-brand-full px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? "bg-brand-accent text-white"
                  : "text-brand-text-muted hover:bg-brand-background"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
