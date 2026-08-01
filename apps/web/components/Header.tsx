import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-brand-border bg-brand-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-semibold text-brand-primary-dark">
          Woodaa
        </Link>
        <nav className="flex items-center gap-6 text-sm text-brand-text-muted">
          <Link href="/betreiber/registrieren" className="hover:text-brand-text">
            Für Pflegeeinrichtungen
          </Link>
          <Link href="/login" className="hover:text-brand-text">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
