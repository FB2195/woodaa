"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const dashboardFor: Record<"SUCHENDE" | "BETREIBER" | "ADMIN", string | null> = {
  SUCHENDE: null,
  BETREIBER: "/betreiber/dashboard",
  ADMIN: "/admin/dashboard",
};

export function Header() {
  const router = useRouter();
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    setMenuOpen(false);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  const dashboardHref = me.data ? dashboardFor[me.data.role] : null;

  const links = (
    <>
      <Link
        href="/betreiber/registrieren"
        onClick={() => setMenuOpen(false)}
        className="hover:text-brand-text"
      >
        Für Pflegeeinrichtungen
      </Link>
      {me.data ? (
        <>
          {dashboardHref && (
            <Link
              href={dashboardHref}
              onClick={() => setMenuOpen(false)}
              className="hover:text-brand-text"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/favoriten"
            onClick={() => setMenuOpen(false)}
            className="hover:text-brand-text"
          >
            Favoriten
          </Link>
          <Link
            href="/konto"
            onClick={() => setMenuOpen(false)}
            className="hover:text-brand-text"
          >
            Mein Konto
          </Link>
          <span className="text-brand-text">{me.data.name}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-brand-md border border-brand-border px-3 py-1.5 text-left hover:text-brand-text"
          >
            Abmelden
          </button>
        </>
      ) : (
        <Link
          href="/login"
          onClick={() => setMenuOpen(false)}
          className="hover:text-brand-text"
        >
          Login
        </Link>
      )}
    </>
  );

  return (
    <header className="border-b border-brand-border bg-brand-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-semibold text-brand-primary-dark">
          Woodaa
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-brand-text-muted md:flex">
          {links}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-brand-md border border-brand-border text-brand-text md:hidden"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-4 border-t border-brand-border px-6 py-5 text-sm text-brand-text-muted md:hidden">
          {links}
        </nav>
      )}
    </header>
  );
}
