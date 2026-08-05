"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "@/lib/i18n/LocaleProvider";
import { trpc } from "@/lib/trpc";

const dashboardFor: Record<"SUCHENDE" | "BETREIBER" | "ADMIN", string | null> = {
  SUCHENDE: null,
  BETREIBER: "/betreiber/dashboard",
  ADMIN: "/admin/dashboard",
};

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function Header() {
  const router = useRouter();
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("header");

  async function logout() {
    setMenuOpen(false);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  const dashboardHref = me.data ? dashboardFor[me.data.role] : null;
  const profileHref = me.data ? "/konto" : "/login";

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="border-b border-brand-border bg-brand-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="woodaa"
            width={786}
            height={412}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={profileHref}
            aria-label={t("myProfile")}
            className="flex h-9 w-9 items-center justify-center rounded-brand-md border border-brand-border text-brand-text hover:bg-brand-background"
          >
            <PersonIcon />
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-brand-md border border-brand-border text-brand-text"
          >
            {menuOpen ? (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-brand-border px-6 py-5 text-sm text-brand-text-muted">
          <Link href="/betreiber/registrieren" onClick={closeMenu} className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text">
            {t("registerFacility")}
          </Link>

          {me.data ? (
            <>
              {dashboardHref && (
                <Link href={dashboardHref} onClick={closeMenu} className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text">
                  {t("dashboard")}
                </Link>
              )}
              <Link href="/favoriten" onClick={closeMenu} className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text">
                {t("favorites")}
              </Link>
              <Link href="/konto" onClick={closeMenu} className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text">
                {t("myAccount")} ({me.data.name})
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-brand-md px-2 py-2 text-left hover:bg-brand-background hover:text-brand-text"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <Link href="/login" onClick={closeMenu} className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text">
              {t("login")}
            </Link>
          )}

          <div className="my-2 border-t border-brand-border" />

          <Link href="/hilfe" onClick={closeMenu} className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text">
            {t("helpSupport")}
          </Link>
          <Link href="/hilfe/kundenservice" onClick={closeMenu} className="rounded-brand-md px-2 py-2 pl-6 hover:bg-brand-background hover:text-brand-text">
            {t("customerService")}
          </Link>
          <Link href="/ueber-uns" onClick={closeMenu} className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text">
            {t("aboutUs")}
          </Link>
          <Link href="/datenschutz" onClick={closeMenu} className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text">
            {t("privacy")}
          </Link>
          <Link href="/impressum" onClick={closeMenu} className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text">
            {t("imprint")}
          </Link>
          <Link href="/cookie-einstellungen" onClick={closeMenu} className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text">
            {t("cookieInfo")}
          </Link>

          <div className="my-2 border-t border-brand-border" />

          <LanguageSwitcher />

          <div className="my-2 border-t border-brand-border" />

          <Link href="/fehler-melden" onClick={closeMenu} className="rounded-brand-md px-2 py-2 font-medium text-brand-text hover:bg-brand-background">
            {t("reportIssue")}
          </Link>
        </nav>
      )}
    </header>
  );
}
