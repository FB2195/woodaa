"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { FacilityChangeRequest } from "@woodaa/api";

type Facility = {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  state: string;
  operatorName: string;
  operatorEmail: string;
  operatorPhone: string | null;
  operatorPhoneDurchwahl: string | null;
};

// Name/Adresse/Ansprechpartner sind trust-sensitive öffentliche Angaben -
// anders als Ausstattung/Unterkunftsrichtlinien gehen Änderungen hier nicht
// sofort live, sondern erst nach Admin-Freigabe (siehe requestFacilityChange
// in operator.ts). Bis dahin bleiben die aktuellen Werte online.
export function FacilityContactForm({
  facility,
  pendingChangeRequest,
}: {
  facility: Facility;
  pendingChangeRequest: FacilityChangeRequest | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const requestChange = trpc.operator.requestFacilityChange.useMutation();
  const cancelChange = trpc.operator.cancelFacilityChangeRequest.useMutation();

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div>
        <h3 className="font-semibold text-brand-heading">Kontaktdaten</h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Name, Adresse und Ansprechpartner sind öffentliche Vertrauensangaben -
          Änderungen hier prüft unser Team kurz, bevor sie live gehen.
        </p>
      </div>

      {pendingChangeRequest && (
        <div className="rounded-brand-md border border-dashed border-brand-accent bg-brand-accent/5 p-4 text-sm">
          <p className="font-medium text-brand-text">
            Änderung wird geprüft - bis dahin sind die aktuellen Angaben unten weiter live.
          </p>
          <ul className="mt-2 flex flex-col gap-0.5 text-brand-text-muted">
            {pendingChangeRequest.name != null && <li>Name: {pendingChangeRequest.name}</li>}
            {pendingChangeRequest.street != null && (
              <li>Straße: {pendingChangeRequest.street}</li>
            )}
            {pendingChangeRequest.postalCode != null && (
              <li>PLZ: {pendingChangeRequest.postalCode}</li>
            )}
            {pendingChangeRequest.city != null && <li>Stadt: {pendingChangeRequest.city}</li>}
            {pendingChangeRequest.state != null && (
              <li>Bundesland: {pendingChangeRequest.state}</li>
            )}
            {pendingChangeRequest.operatorName != null && (
              <li>Ansprechpartner: {pendingChangeRequest.operatorName}</li>
            )}
            {pendingChangeRequest.operatorEmail != null && (
              <li>E-Mail: {pendingChangeRequest.operatorEmail}</li>
            )}
            {pendingChangeRequest.operatorPhone != null && (
              <li>Telefon: {pendingChangeRequest.operatorPhone}</li>
            )}
            {pendingChangeRequest.operatorPhoneDurchwahl != null && (
              <li>Durchwahl: {pendingChangeRequest.operatorPhoneDurchwahl}</li>
            )}
          </ul>
          <button
            type="button"
            onClick={async () => {
              setError(null);
              try {
                await cancelChange.mutateAsync();
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
              }
            }}
            disabled={cancelChange.isPending}
            className="mt-3 text-sm font-medium text-brand-accent underline disabled:opacity-50"
          >
            {cancelChange.isPending ? "Wird zurückgezogen…" : "Änderung zurückziehen"}
          </button>
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);
          const values = {
            name: String(form.get("name") ?? "").trim(),
            street: String(form.get("street") ?? "").trim(),
            postalCode: String(form.get("postalCode") ?? "").trim(),
            city: String(form.get("city") ?? "").trim(),
            state: String(form.get("state") ?? "").trim(),
            operatorName: String(form.get("operatorName") ?? "").trim(),
            operatorEmail: String(form.get("operatorEmail") ?? "").trim(),
            operatorPhone: String(form.get("operatorPhone") ?? "").trim(),
            operatorPhoneDurchwahl: String(form.get("operatorPhoneDurchwahl") ?? "").trim(),
          };

          // Nur tatsächlich geänderte Felder gehen in die Anfrage - siehe
          // RequestFacilityChangeInput ("Mindestens ein Feld muss geändert werden").
          // Nullable facility fields (operatorPhone/operatorPhoneDurchwahl)
          // normalize to "" for the comparison so an untouched empty field
          // doesn't look "changed" just because null !== "".
          const changed = Object.fromEntries(
            Object.entries(values).filter(
              ([key, value]) =>
                value !== ((facility as Record<string, string | null>)[key] ?? ""),
            ),
          );

          if (Object.keys(changed).length === 0) {
            setError("Keine Änderung erkannt.");
            return;
          }

          try {
            await requestChange.mutateAsync(changed);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
          }
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Name der Einrichtung
          <input
            name="name"
            defaultValue={facility.name}
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Straße und Hausnummer
          <input
            name="street"
            defaultValue={facility.street}
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            PLZ
            <input
              name="postalCode"
              defaultValue={facility.postalCode}
              required
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Stadt
            <input
              name="city"
              defaultValue={facility.city}
              required
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Bundesland
          <input
            name="state"
            defaultValue={facility.state}
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <div className="border-t border-brand-border pt-4">
          <p className="text-sm font-medium text-brand-text">Ansprechpartner</p>
          <p className="mt-1 text-xs text-brand-text-muted">
            Wird auf der Einrichtungsseite als Kontakt angezeigt - Telefonnummer und E-Mail
            sehen nur wir, nicht die Nutzer.
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Name
          <input
            name="operatorName"
            defaultValue={facility.operatorName}
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          E-Mail
          <input
            name="operatorEmail"
            type="email"
            defaultValue={facility.operatorEmail}
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Telefon
          <input
            name="operatorPhone"
            defaultValue={facility.operatorPhone ?? ""}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Durchwahl
          <input
            name="operatorPhoneDurchwahl"
            defaultValue={facility.operatorPhoneDurchwahl ?? ""}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={requestChange.isPending}
          className="self-start rounded-brand-md bg-brand-accent px-5 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {requestChange.isPending ? "Wird gesendet…" : "Änderung zur Prüfung einreichen"}
        </button>

        {requestChange.isSuccess && (
          <p className="text-sm text-brand-accent">
            ✓ Änderung eingereicht - wird von unserem Team geprüft. Bis dahin bleiben die
            aktuellen Angaben live.
          </p>
        )}
      </form>
    </div>
  );
}
