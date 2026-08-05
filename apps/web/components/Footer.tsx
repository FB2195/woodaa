import Link from "next/link";

const columns: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "woodaa",
    links: [
      { href: "/ueber-uns", label: "Über uns" },
      { href: "/betreiber/registrieren", label: "Pflegeheim registrieren" },
    ],
  },
  {
    heading: "Hilfe & Support",
    links: [
      { href: "/hilfe", label: "Hilfe & Support" },
      { href: "/hilfe/kundenservice", label: "Kundenservice" },
      { href: "/hilfe/kundenservice#faq", label: "FAQ" },
      { href: "/fehler-melden", label: "Fehler/Problem melden" },
    ],
  },
  {
    heading: "Rechtliches",
    links: [
      { href: "/datenschutz", label: "Datenschutz" },
      { href: "/impressum", label: "Impressum" },
      { href: "/cookie-einstellungen", label: "Cookie-Infos" },
    ],
  },
];

export function Footer() {
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
        © {new Date().getFullYear()} woodaa
      </div>
    </footer>
  );
}
