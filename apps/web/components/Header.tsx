"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

const dashboardFor: Record<"SUCHENDE" | "BETREIBER" | "ADMIN", string | null> = {
  SUCHENDE: null,
  BETREIBER: "/betreiber/dashboard",
  ADMIN: "/admin/dashboard",
};

export function Header() {
  const router = useRouter();
  const me = trpc.auth.me.useQuery(undefined, { retry: false });

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  const dashboardHref = me.data ? dashboardFor[me.data.role] : null;

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
          {me.data ? (
            <>
              {dashboardHref && (
                <Link href={dashboardHref} className="hover:text-brand-text">
                  Dashboard
                </Link>
              )}
              <Link href="/favoriten" className="hover:text-brand-text">
                Favoriten
              </Link>
              <Link href="/konto" className="hover:text-brand-text">
                Mein Konto
              </Link>
              <span className="text-brand-text">{me.data.name}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-brand-md border border-brand-border px-3 py-1.5 hover:text-brand-text"
              >
                Abmelden
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:text-brand-text">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
