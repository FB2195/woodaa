"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AppPromoBanner } from "@/components/AppPromoBanner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslations } from "@/lib/i18n/LocaleProvider";
import { trpc } from "@/lib/trpc";
import { useLogout } from "@/lib/useLogout";

const dashboardFor: Record<"SUCHENDE" | "BETREIBER" | "MITARBEITER" | "ADMIN", string | null> = {
  SUCHENDE: null,
  BETREIBER: "/betreiber/dashboard",
  MITARBEITER: "/betreiber/dashboard",
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
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const t = useTranslations("header");
  const { logout, loggingOut } = useLogout();

  const dashboardHref = me.data ? dashboardFor[me.data.role] : null;

  function closeMenu() {
    setMenuOpen(false);
  }

  function closeLoginMenu() {
    setLoginMenuOpen(false);
  }

  return (
    <>
      <AppPromoBanner />
      <header className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="flex items-end gap-1.5 rounded-brand-md px-2 py-1 -mx-2 -my-1 transition-colors active:bg-brand-background"
          >
            <Image
              src="/logo.png"
              alt="woodaa"
              width={478}
              height={142}
              priority
              className="h-9 w-auto"
            />
            {/* Baked into the logo image itself before, as a light gray that
              was hard to read - especially in dark mode, where the fixed
              raster color has no way to adapt. Rendered as real text now,
              same brand-text-muted token every other muted label already
              uses, so it stays legible in both themes. */}
            <span className="pb-0.5 text-xs font-medium text-brand-text-muted">Wo? Da!</span>
          </Link>

          <div className="flex items-center gap-2">
            {me.data ? (
              <Link
                href="/konto"
                aria-label={t("myProfile")}
                className="flex h-9 w-9 items-center justify-center rounded-brand-md border border-brand-border text-brand-text hover:bg-brand-background"
              >
                <PersonIcon />
              </Link>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLoginMenuOpen((open) => !open)}
                  aria-label={t("myProfile")}
                  aria-expanded={loginMenuOpen}
                  className="flex h-9 w-9 items-center justify-center rounded-brand-md border border-brand-border text-brand-text hover:bg-brand-background"
                >
                  <PersonIcon />
                </button>

                {loginMenuOpen && (
                  <nav className="absolute right-0 top-full z-10 mt-2 flex w-64 flex-col gap-1 rounded-brand-lg border border-brand-border bg-brand-surface p-2 text-sm text-brand-text-muted shadow-lg">
                    <Link
                      href="/login"
                      onClick={closeLoginMenu}
                      className="rounded-brand-md px-3 py-2 hover:bg-brand-background hover:text-brand-text"
                    >
                      {t("login")}
                    </Link>
                    <Link
                      href="/registrieren"
                      onClick={closeLoginMenu}
                      className="rounded-brand-md px-3 py-2 hover:bg-brand-background hover:text-brand-text"
                    >
                      {t("register")}
                    </Link>
                    <Link
                      href="/betreiber/login"
                      onClick={closeLoginMenu}
                      className="rounded-brand-md px-3 py-2 hover:bg-brand-background hover:text-brand-text"
                    >
                      {t("operatorLogin")}
                    </Link>

                    <div className="my-1 border-t border-brand-border" />

                    <Link
                      href="/betreiber/login"
                      onClick={closeLoginMenu}
                      className="rounded-brand-md px-3 py-2 font-medium text-brand-accent hover:bg-brand-background"
                    >
                      {t("registerFacility")}
                    </Link>
                  </nav>
                )}
              </div>
            )}

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
            <Link
              href="/"
              onClick={closeMenu}
              className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text"
            >
              {t("home")}
            </Link>
            <Link
              href="/suche"
              onClick={closeMenu}
              className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text"
            >
              {t("searchFacilities")}
            </Link>

            {me.data && (
              <>
                <div className="my-2 border-t border-brand-border" />

                {dashboardHref && (
                  <Link
                    href={dashboardHref}
                    onClick={closeMenu}
                    className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text"
                  >
                    {t("dashboard")}
                  </Link>
                )}
                {me.data.role === "SUCHENDE" && (
                  <Link
                    href="/favoriten"
                    onClick={closeMenu}
                    className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text"
                  >
                    {t("favorites")}
                  </Link>
                )}
                <Link
                  href="/konto"
                  onClick={closeMenu}
                  className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text"
                >
                  {t("myAccount")}
                </Link>
              </>
            )}

            <div className="my-2 border-t border-brand-border" />

            <Link
              href="/hilfe"
              onClick={closeMenu}
              className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text"
            >
              {t("helpSupport")}
            </Link>
            <Link
              href="/ueber-uns"
              onClick={closeMenu}
              className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text"
            >
              {t("aboutUs")}
            </Link>
            <Link
              href="/datenschutz"
              onClick={closeMenu}
              className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/impressum"
              onClick={closeMenu}
              className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text"
            >
              {t("imprint")}
            </Link>
            <Link
              href="/cookie-einstellungen"
              onClick={closeMenu}
              className="rounded-brand-md px-2 py-2 hover:bg-brand-background hover:text-brand-text"
            >
              {t("cookieInfo")}
            </Link>

            <div className="my-2 border-t border-brand-border" />

            <LanguageSwitcher />
            <ThemeToggle />

            <div className="my-2 border-t border-brand-border" />

            <Link
              href="/fehler-melden"
              onClick={closeMenu}
              className="rounded-brand-md px-2 py-2 font-medium text-brand-text hover:bg-brand-background"
            >
              {t("reportIssue")}
            </Link>

            {/* Ganz unten, hervorgehoben - für eingeloggte Suchende/Betreiber/
              Admins irrelevant, siehe Gating oben. Führt zunächst auf die
              business.woodaa.de-Hauptseite (Betreiber-Login) statt direkt
              ins Registrierungsformular. */}
            {!me.data && (
              <>
                <div className="my-2 border-t border-brand-border" />
                <Link
                  href="/betreiber/login"
                  onClick={closeMenu}
                  className="rounded-brand-md bg-brand-accent px-3 py-2.5 text-center font-semibold text-white transition hover:opacity-90"
                >
                  {t("registerFacility")}
                </Link>
              </>
            )}

            {/* Abmelden ganz unten, wie bei Booking. */}
            {me.data && (
              <>
                <div className="my-2 border-t border-brand-border" />
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    void logout();
                  }}
                  disabled={loggingOut}
                  className="rounded-brand-md px-2 py-2 text-left text-red-600 hover:bg-brand-background disabled:opacity-60 dark:text-red-400"
                >
                  {loggingOut ? `${t("logout")}…` : t("logout")}
                </button>
              </>
            )}
          </nav>
        )}
      </header>
    </>
  );
}
