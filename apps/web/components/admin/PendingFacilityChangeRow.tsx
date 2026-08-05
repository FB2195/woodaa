"use client";

import type { AdminPendingFacilityChange } from "@woodaa/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const fields: {
  key: "name" | "street" | "postalCode" | "city" | "state" | "operatorName" | "operatorEmail" | "operatorPhone";
  label: string;
}[] = [
  { key: "name", label: "Name" },
  { key: "street", label: "Straße" },
  { key: "postalCode", label: "PLZ" },
  { key: "city", label: "Stadt" },
  { key: "state", label: "Bundesland" },
  { key: "operatorName", label: "Ansprechpartner" },
  { key: "operatorEmail", label: "E-Mail" },
  { key: "operatorPhone", label: "Telefon" },
];

export function PendingFacilityChangeRow({
  change,
}: {
  change: AdminPendingFacilityChange;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const approve = trpc.admin.approveFacilityChange.useMutation();
  const reject = trpc.admin.rejectFacilityChange.useMutation();
  const pending = approve.isPending || reject.isPending;

  const changedFields = fields.filter((field) => change[field.key] != null);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-heading">{change.facility.name}</h3>
          <p className="text-sm text-brand-text-muted">
            {change.facility.street}, {change.facility.postalCode} {change.facility.city}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => approve.mutateAsync({ id: change.id }))}
            className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Freigeben
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => reject.mutateAsync({ id: change.id }))}
            className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text-muted transition hover:text-red-600 disabled:opacity-50"
          >
            Ablehnen
          </button>
        </div>
      </div>

      <table className="mt-4 w-full text-sm">
        <tbody>
          {changedFields.map(({ key, label }) => (
            <tr key={key} className="border-t border-brand-border">
              <td className="py-1.5 pr-4 font-medium text-brand-text">{label}</td>
              <td className="py-1.5 pr-4 text-brand-text-muted line-through">
                {change.facility[key] ?? "-"}
              </td>
              <td className="py-1.5 text-brand-text">{change[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
