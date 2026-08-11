"use client";

import { useEffect, useState } from "react";
import { CONSENT_CHANGED_EVENT, readConsentCookie } from "@/lib/cookieConsent";

// Persistent bottom bar on small screens, mirroring Booking.com's sticky
// "Zimmer auswählen" CTA - on desktop the booking widget itself already
// stays in view (see the sticky sidebar in the facility page), so this is
// lg:hidden. Links to the #verfuegbarkeit anchor rather than a single
// fixed action, since a facility can offer several booking types at once
// (stationär/Kurzzeit/Tages-/Nachtpflege), each with its own state
// (buchbar/Warteliste) - there is no single "the" CTA to duplicate here.
export function MobileBookingBar() {
  // CookieConsentBanner (rendered globally in providers.tsx) is also a
  // fixed bottom-0 bar until the visitor decides - stacking two
  // independent fixed bars there is either an overlap or fragile pixel
  // math, so this one just steps aside while consent is still undecided.
  const [hideForCookieBanner, setHideForCookieBanner] = useState(true);

  useEffect(() => {
    const sync = () => setHideForCookieBanner(readConsentCookie() === null);
    sync();
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
  }, []);

  if (hideForCookieBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-brand-surface p-4 lg:hidden">
      <a
        href="#verfuegbarkeit"
        className="block rounded-brand-md bg-brand-accent px-6 py-3 text-center font-semibold text-white transition hover:opacity-90"
      >
        Verfügbarkeit ansehen
      </a>
    </div>
  );
}
