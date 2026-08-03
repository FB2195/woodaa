"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { pflegegradOptions } from "@/lib/pflegegradLabels";

export function CreateFacilityForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const createFacility = trpc.operator.createFacility.useMutation();

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const amenities = String(form.get("amenities") ?? "")
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean);
        const minPflegegradRaw = String(form.get("minPflegegrad") ?? "");
        const maxPflegegradRaw = String(form.get("maxPflegegrad") ?? "");

        try {
          await createFacility.mutateAsync({
            name: String(form.get("name") ?? ""),
            description: String(form.get("description") ?? ""),
            street: String(form.get("street") ?? ""),
            postalCode: String(form.get("postalCode") ?? ""),
            city: String(form.get("city") ?? ""),
            state: String(form.get("state") ?? ""),
            amenities,
            operatorPhone: String(form.get("operatorPhone") ?? "") || undefined,
            minPflegegrad: minPflegegradRaw
              ? (Number(minPflegegradRaw) as 0 | 1 | 2 | 3 | 4 | 5)
              : undefined,
            maxPflegegrad: maxPflegegradRaw
              ? (Number(maxPflegegradRaw) as 0 | 1 | 2 | 3 | 4 | 5)
              : undefined,
          });
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
          );
        }
      }}
    >
      <h2 className="text-lg font-semibold text-brand-primary-dark">
        Einrichtung anlegen
      </h2>
      <p className="text-sm text-brand-text-muted">
        Deine Einrichtung wird nach dem Anlegen von unserem Team geprüft,
        bevor sie öffentlich sichtbar ist.
      </p>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Name der Einrichtung
        <input
          name="name"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Beschreibung
        <textarea
          name="description"
          required
          rows={4}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Straße & Hausnummer
        <input
          name="street"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          PLZ
          <input
            name="postalCode"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Stadt
          <input
            name="city"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Bundesland
        <input
          name="state"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Ausstattung (kommagetrennt)
        <input
          name="amenities"
          placeholder="Barrierefreiheit, Garten, Einzelzimmer"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Geeignet ab Pflegegrad
          <select
            name="minPflegegrad"
            defaultValue=""
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">Nicht angegeben</option>
            {pflegegradOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Geeignet bis Pflegegrad
          <select
            name="maxPflegegrad"
            defaultValue=""
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">Nicht angegeben</option>
            {pflegegradOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Telefon (optional)
        <input
          name="operatorPhone"
          type="tel"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={createFacility.isPending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {createFacility.isPending ? "Wird angelegt…" : "Einrichtung anlegen"}
      </button>
    </form>
  );
}
