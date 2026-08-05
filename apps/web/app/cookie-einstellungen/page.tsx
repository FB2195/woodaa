"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { clearConsentCookie, readConsentCookie, writeConsentCookie } from "@/lib/cookieConsent";

const statusLabels = {
  accepted: "Akzeptiert",
  declined: "Abgelehnt",
} as const;

export default function CookieEinstellungenPage() {
  const [status, setStatus] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    setStatus(readConsentCookie());
  }, []);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">Cookie-Infos</h1>

        <div className="mt-6 flex flex-col gap-4 text-brand-text">
          <p>
            woodaa verwendet ausschließlich technisch notwendige Cookies. Sie dienen dazu,
            dich nach dem Login eingeloggt zu halten und deine Sitzung sicher zu verwalten.
            Wir setzen keine Tracking-, Analyse- oder Marketing-Cookies.
          </p>

          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-text-muted">
                <th className="py-2 pr-4">Cookie</th>
                <th className="py-2 pr-4">Zweck</th>
                <th className="py-2">Gültigkeit</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-brand-border">
                <td className="py-2 pr-4">Session-Cookie</td>
                <td className="py-2 pr-4">Hält dich eingeloggt, technisch notwendig</td>
                <td className="py-2">Bis Logout bzw. Ablauf der Sitzung</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">woodaa_cookie_consent</td>
                <td className="py-2 pr-4">Speichert deine Cookie-Auswahl</td>
                <td className="py-2">12 Monate</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
          <p className="text-sm text-brand-text-muted">Deine aktuelle Auswahl</p>
          <p className="mt-1 font-semibold text-brand-heading">
            {status ? statusLabels[status] : "Noch keine Auswahl getroffen"}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                writeConsentCookie("accepted");
                setStatus("accepted");
              }}
              className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Akzeptieren
            </button>
            <button
              type="button"
              onClick={() => {
                writeConsentCookie("declined");
                setStatus("declined");
              }}
              className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-background"
            >
              Ablehnen
            </button>
            <button
              type="button"
              onClick={() => {
                clearConsentCookie();
                setStatus(null);
              }}
              className="rounded-brand-md px-4 py-2 text-sm text-brand-text-muted underline hover:text-brand-text"
            >
              Auswahl zurücksetzen
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
