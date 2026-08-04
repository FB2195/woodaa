"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function CreateFacilityForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const createFacility = trpc.operator.createFacility.useMutation();

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 text-center">
        <span className="text-3xl">👋</span>
        <h1 className="mt-2 text-2xl font-bold text-brand-primary-dark">
          Fast geschafft
        </h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Name und Adresse eurer Einrichtung - mehr braucht es nicht, um
          loszulegen. Alles Weitere könnt ihr später ergänzen.
        </p>
      </div>

      <form
        className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);

          try {
            await createFacility.mutateAsync({
              name: String(form.get("name") ?? ""),
              street: String(form.get("street") ?? ""),
              postalCode: String(form.get("postalCode") ?? ""),
              city: String(form.get("city") ?? ""),
              state: String(form.get("state") ?? ""),
              description: "",
              amenities: [],
              operatorPhone: String(form.get("operatorPhone") ?? "") || undefined,
            });
            router.refresh();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
            );
          }
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Name der Einrichtung
          <input
            name="name"
            required
            autoFocus
            placeholder="z. B. Seniorenzentrum Am Park"
            className="rounded-brand-md border border-brand-border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Straße & Hausnummer
          <input
            name="street"
            required
            placeholder="Musterstraße 12"
            className="rounded-brand-md border border-brand-border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            PLZ
            <input
              name="postalCode"
              required
              placeholder="12345"
              className="rounded-brand-md border border-brand-border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Stadt
            <input
              name="city"
              required
              placeholder="Musterstadt"
              className="rounded-brand-md border border-brand-border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Bundesland
          <input
            name="state"
            required
            placeholder="Nordrhein-Westfalen"
            className="rounded-brand-md border border-brand-border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Telefon (optional)
          <input
            name="operatorPhone"
            type="tel"
            placeholder="030 12345678"
            className="rounded-brand-md border border-brand-border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={createFacility.isPending}
          className="mt-2 rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {createFacility.isPending ? "Wird angelegt…" : "Kostenlos loslegen"}
        </button>
      </form>
    </div>
  );
}
