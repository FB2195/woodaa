"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { trpc } from "@/lib/trpc";
import type { FacilityWithCapacities } from "@woodaa/api";

export function PendingFacilityRow({
  facility,
}: {
  facility: FacilityWithCapacities;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const approve = trpc.admin.approveFacility.useMutation();
  const reject = trpc.admin.rejectFacility.useMutation();
  const pending = approve.isPending || reject.isPending;

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-heading">
            {facility.name}
          </h3>
          <p className="mt-1 text-sm text-brand-text-muted">
            {facility.street}, {facility.postalCode} {facility.city}
          </p>
          <p className="mt-1 text-sm text-brand-text-muted">
            Betreiber: {facility.operatorName} ({facility.operatorEmail}
            {facility.operatorPhone ? `, ${facility.operatorPhone}` : ""})
          </p>
          <p className="mt-3 text-sm text-brand-text">{facility.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {facility.capacities.map((capacity) => (
              <span
                key={capacity.id}
                className="rounded-brand-full border border-brand-border px-3 py-1 text-xs text-brand-text-muted"
              >
                {bookingTypeLabels[capacity.bookingType]}:{" "}
                {capacity.availableSlots}/{capacity.totalSlots}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setError(null);
              try {
                await approve.mutateAsync({ id: facility.id });
                router.refresh();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
                );
              }
            }}
            className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Freischalten
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setError(null);
              try {
                await reject.mutateAsync({ id: facility.id });
                router.refresh();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
                );
              }
            }}
            className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text-muted transition hover:text-red-600 disabled:opacity-50"
          >
            Ablehnen
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
