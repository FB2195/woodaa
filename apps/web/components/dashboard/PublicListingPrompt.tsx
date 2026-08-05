"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function PublicListingPrompt() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateFacility = trpc.operator.updateFacility.useMutation();

  if (!expanded) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-brand-lg border border-dashed border-brand-accent bg-brand-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-brand-primary-dark">
            🌍 Öffentlich auf woodaa sichtbar werden
          </h3>
          <p className="mt-1 text-sm text-brand-text-muted">
            Optional, jederzeit möglich: Familien finden euch dann auch bei
            der Suche auf woodaa - eure Verfügbarkeit ist ja schon gepflegt.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="shrink-0 rounded-brand-md bg-brand-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
        >
          Jetzt vervollständigen
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6 shadow-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const description = String(form.get("description") ?? "").trim();

        if (!description) {
          setError("Bitte gib eine kurze Beschreibung ein.");
          return;
        }

        try {
          await updateFacility.mutateAsync({ description });
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
          );
        }
      }}
    >
      <div>
        <h3 className="font-semibold text-brand-primary-dark">
          Öffentliche Sichtbarkeit vervollständigen
        </h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Nach dem Absenden prüft unser Team die Angaben kurz, dann seid ihr
          live. Fotos könnt ihr weiter unten jederzeit ergänzen.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Beschreibung
        <textarea
          name="description"
          required
          rows={4}
          placeholder="Erzählt Familien, was eure Einrichtung besonders macht..."
          className="rounded-brand-md border border-brand-border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <p className="text-xs text-brand-text-muted">
        Eure Ausstattung (Einzelzimmer, Garten, ...) pflegt ihr weiter unten im Dashboard.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={updateFacility.isPending}
          className="rounded-brand-md bg-brand-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {updateFacility.isPending ? "Wird gesendet…" : "Zur Prüfung einreichen"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="rounded-brand-md px-5 py-2.5 font-semibold text-brand-text-muted transition hover:text-brand-text"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
