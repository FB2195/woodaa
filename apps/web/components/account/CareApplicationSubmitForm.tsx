"use client";

import { useState } from "react";
import type { BookingType } from "@woodaa/validators";
import { trpc } from "@/lib/trpc";

export function CareApplicationSubmitForm({
  bookingType,
  onDone,
  onCancel,
}: {
  bookingType: BookingType;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const submit = trpc.careApplication.submitCareApplication.useMutation();

  return (
    <form
      className="mt-3 flex flex-col gap-3 rounded-brand-md bg-brand-background p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const signatureName = String(form.get("signatureName") ?? "").trim();

        if (!confirmed) {
          setError("Bitte bestätige, dass die Angaben korrekt sind.");
          return;
        }

        try {
          await submit.mutateAsync({ bookingType, signatureName, confirmed: true });
          onDone();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
        }
      }}
    >
      <p className="text-xs text-brand-text-muted">
        Wir erstellen aus deinen hinterlegten Angaben (Versicherungsnummer,
        Pflegegrad) automatisch ein Antragsformular und senden es digital an
        eure Krankenkasse.
      </p>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Digitale Unterschrift (voller Name)
        <input
          name="signatureName"
          required
          placeholder="Vor- und Nachname"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex items-start gap-2 text-xs text-brand-text-muted">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5"
        />
        Ich bestätige, dass die hinterlegten Angaben korrekt sind, und reiche
        hiermit den Antrag digital bei meiner Krankenkasse ein.
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submit.isPending}
          className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submit.isPending ? "Wird eingereicht…" : "Antrag einreichen"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-brand-md px-4 py-2 text-sm font-semibold text-brand-text-muted transition hover:text-brand-text"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
