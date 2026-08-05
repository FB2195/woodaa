"use client";

import { SupportRequestForm } from "@/components/support/SupportRequestForm";
import { trpc } from "@/lib/trpc";

// Facility-only contact channels, deliberately not shown to Suchende - kept
// as a separate component (rather than inline in the page) so the gate
// lives in one place next to the query that decides it.
export function OperatorSupportChannels() {
  const me = trpc.auth.me.useQuery(undefined, { retry: false });

  if (me.data?.role !== "BETREIBER") {
    return null;
  }

  return (
    <>
      <h2 className="mt-10 text-lg font-semibold text-brand-text">
        Partner-Support für Einrichtungen
      </h2>
      <div className="mt-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        <p className="text-brand-text">
          {/* Platzhalter - vor Live-Gang durch echte Partner-Hotline-Nummer ersetzen */}
          [Partner-Hotline] - für Fragen rund um euer Betreiber-Konto
        </p>
        <p className="mt-2 text-sm text-brand-text-muted">
          Erreichbar Mo-Fr, 8-18 Uhr. Für dringende Fälle nutzt bitte die Nachricht unten.
        </p>
      </div>
      <div className="mt-4">
        <SupportRequestForm type="KONTAKT" submitLabel="Nachricht an den Partner-Support" />
      </div>
    </>
  );
}
