"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { computeUnitStatus } from "@/lib/unitStatus";
import { PflegegradPricingTable } from "./PflegegradPricingTable";
import { RoomMap } from "./RoomMap";
import type { BookingType } from "@woodaa/validators";
import type { FacilityCapacity, FacilityUnit, UnitBooking } from "@woodaa/api";

type BookingWithVollmachtFlag = UnitBooking & {
  user: { vollmachtDocumentKey: string | null } | null;
};
type Unit = FacilityUnit & { bookings: BookingWithVollmachtFlag[] };

function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function CategoryPanel({
  bookingType,
  capacity,
  units,
}: {
  bookingType: BookingType;
  capacity?: FacilityCapacity;
  units: Unit[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const updatePricing = trpc.operator.updatePricing.useMutation();
  const setUnitCount = trpc.operator.setUnitCount.useMutation();

  const totalUnits = units.length;
  const freeUnits = units.filter((u) => computeUnitStatus(u.bookings).status === "FREI").length;

  async function runMutation(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-brand-heading">{bookingTypeLabels[bookingType]}</h3>
        <span
          className={
            freeUnits > 0
              ? "text-sm font-semibold text-brand-accent"
              : "text-sm text-brand-text-muted"
          }
        >
          {freeUnits} von {totalUnits} frei
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-1 text-xs text-brand-text-muted">
          Preis in der Suche ("ab X €/Monat")
          <p className="text-sm font-medium text-brand-text">
            {capacity?.monthlyPriceCents != null
              ? `${(capacity.monthlyPriceCents / 100).toLocaleString("de-DE")} €/Monat`
              : "Preis auf Anfrage"}
          </p>
          <p className="max-w-xs text-brand-text-muted">
            Wird automatisch aus dem günstigsten Pflegegrad-Satz unten berechnet - keine eigene
            Eingabe nötig.
          </p>
        </div>

        {bookingType === "STATIONAERE_AUFNAHME" && (
          <form
            className="flex items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const availableFromRaw = String(form.get("availableFrom") ?? "");
              runMutation(() =>
                updatePricing.mutateAsync({
                  bookingType,
                  availableFrom: availableFromRaw
                    ? new Date(availableFromRaw).toISOString()
                    : undefined,
                }),
              );
            }}
          >
            <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
              Nächster freier Platz ab (falls 0 frei)
              <input
                type="date"
                name="availableFrom"
                defaultValue={toDateInputValue(capacity?.availableFrom)}
                className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <button
              type="submit"
              disabled={updatePricing.isPending}
              className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-background disabled:opacity-50"
            >
              {updatePricing.isPending ? "…" : "Speichern"}
            </button>
          </form>
        )}

        {bookingType === "KURZZEITPFLEGE" && (
          <form
            className="flex items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const minStayNightsRaw = String(form.get("minStayNights") ?? "").trim();
              runMutation(() =>
                updatePricing.mutateAsync({
                  bookingType,
                  minStayNights: minStayNightsRaw ? Number(minStayNightsRaw) : undefined,
                }),
              );
            }}
          >
            <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
              Mindestaufenthalt (Nächte)
              <input
                type="number"
                name="minStayNights"
                min={1}
                max={60}
                placeholder="kein Minimum"
                defaultValue={capacity?.minStayNights ?? ""}
                className="w-40 rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <button
              type="submit"
              disabled={updatePricing.isPending}
              className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-background disabled:opacity-50"
            >
              {updatePricing.isPending ? "…" : "Speichern"}
            </button>
          </form>
        )}
      </div>

      <PflegegradPricingTable bookingType={bookingType} rates={capacity?.pflegegradPricing ?? []} />

      <form
        className="flex items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const total = Number(form.get("totalUnits"));
          runMutation(() => setUnitCount.mutateAsync({ bookingType, totalUnits: total }));
        }}
      >
        <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
          Plätze insgesamt
          <input
            type="number"
            name="totalUnits"
            min={0}
            defaultValue={totalUnits}
            className="w-24 rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <button
          type="submit"
          disabled={setUnitCount.isPending}
          className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-background disabled:opacity-50"
        >
          {setUnitCount.isPending ? "…" : "Anpassen"}
        </button>
      </form>

      <RoomMap bookingType={bookingType} units={units} />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
