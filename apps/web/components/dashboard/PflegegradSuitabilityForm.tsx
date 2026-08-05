"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { pflegegradOptions } from "@/lib/pflegegradLabels";

export function PflegegradSuitabilityForm({
  minPflegegrad,
  maxPflegegrad,
}: {
  minPflegegrad: number | null;
  maxPflegegrad: number | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const updateFacility = trpc.operator.updateFacility.useMutation();

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const minRaw = String(form.get("minPflegegrad") ?? "");
        const maxRaw = String(form.get("maxPflegegrad") ?? "");

        try {
          await updateFacility.mutateAsync({
            minPflegegrad: minRaw
              ? (Number(minRaw) as 0 | 1 | 2 | 3 | 4 | 5)
              : undefined,
            maxPflegegrad: maxRaw
              ? (Number(maxRaw) as 0 | 1 | 2 | 3 | 4 | 5)
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
      <h3 className="font-semibold text-brand-heading">
        Pflegegrad-Eignung
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Geeignet ab Pflegegrad
          <select
            name="minPflegegrad"
            defaultValue={minPflegegrad ?? ""}
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
            defaultValue={maxPflegegrad ?? ""}
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={updateFacility.isPending}
        className="self-start rounded-brand-md bg-brand-accent px-5 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {updateFacility.isPending ? "Wird gespeichert…" : "Speichern"}
      </button>
    </form>
  );
}
