// Scopes the entire /betreiber tree (login, registrieren, dashboard) to
// business.woodaa.de's own palette - see .operator-theme in globals.css.
export default function BetreiberLayout({ children }: { children: React.ReactNode }) {
  return <div className="operator-theme min-h-screen bg-brand-background">{children}</div>;
}
