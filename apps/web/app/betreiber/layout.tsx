import type { Metadata } from "next";

// Overrides the root layout's consumer-facing title/description for the
// whole /betreiber tree - without this every tab on business.woodaa.de
// would read "woodaa – Pflegeplätze finden und buchen", the exact opposite
// of the "eigene, exklusive Umgebung" this portal is meant to feel like.
// Per-page metadata (see each page.tsx) fills in the "%s" for its own tab.
export const metadata: Metadata = {
  title: {
    template: "%s · Betreiber-Portal",
    default: "Betreiber-Portal für Pflegeeinrichtungen | woodaa",
  },
  description:
    "Das exklusive Portal für Pflegeeinrichtungen auf woodaa: Belegung, Buchungen, Zahlungen, Team und Bewertungen an einem Ort.",
};

// Scopes the entire /betreiber tree (login, registrieren, dashboard) to
// business.woodaa.de's own palette - see .operator-theme in globals.css.
export default function BetreiberLayout({ children }: { children: React.ReactNode }) {
  return <div className="operator-theme min-h-screen bg-brand-background">{children}</div>;
}
