"use client";

import { useEffect, useState } from "react";

const CONSENT_COOKIE = "woodaa_cookie_consent";
const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

function readConsentCookie(): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function writeConsentCookie(value: "accepted" | "declined") {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax`;
}

// Not httpOnly on purpose - this isn't a security-sensitive cookie, and a
// future analytics/tracking script needs to read it client-side before
// deciding whether to load. No non-essential cookies are set today (only
// the existing httpOnly session cookies, which are exempt as strictly
// necessary), so this just establishes the mechanism ahead of time.
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsentCookie() === null);
  }, []);

  if (!visible) return null;

  function choose(value: "accepted" | "declined") {
    writeConsentCookie(value);
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-brand-surface px-6 py-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-brand-text-muted">
          Wir verwenden nur technisch notwendige Cookies, um dich eingeloggt
          zu halten. Keine Tracking- oder Marketing-Cookies.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="rounded-brand-md px-4 py-2 text-sm text-brand-text-muted hover:text-brand-text"
          >
            Ablehnen
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
