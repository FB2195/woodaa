"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { bookingTypeLabels, dateRangedBookingTypes } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import type { BookingType } from "@woodaa/validators";
import type { FacilityCapacity, FacilityUnit, UnitBooking } from "@woodaa/api";

type Unit = FacilityUnit & { bookings: UnitBooking[] };

function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

const sourceLabels: Record<UnitBooking["source"], string> = {
  ONLINE: "online",
  TELEFON: "Telefon",
  VOR_ORT: "vor Ort",
};

function UnitRow({
  unit,
  onRename,
  onCancelBooking,
  cancelPending,
}: {
  unit: Unit;
  onRename: (label: string) => void;
  onCancelBooking: (bookingId: string) => void;
  cancelPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(unit.label);
  const booking = unit.bookings[0];

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-brand-md border border-brand-border px-3 py-2 text-sm">
      {editing ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onRename(value);
            setEditing(false);
          }}
        >
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
            className="w-32 rounded-brand-md border border-brand-border px-2 py-1 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <button type="submit" className="text-brand-accent">
            ✓
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Umbenennen"
          className="font-medium text-brand-text hover:underline"
        >
          {unit.label}
        </button>
      )}

      {booking ? (
        <div className="flex items-center gap-3">
          <span className="text-brand-text-muted">
            belegt ({sourceLabels[booking.source]})
            {booking.startDate && booking.endDate
              ? ` · ${formatDate(booking.startDate)}–${formatDate(booking.endDate)}`
              : ""}
            {booking.guestName ? ` · ${booking.guestName}` : ""}
          </span>
          <button
            type="button"
            disabled={cancelPending}
            onClick={() => onCancelBooking(booking.id)}
            className="text-brand-text-muted hover:text-red-600 disabled:opacity-50"
          >
            Stornieren
          </button>
        </div>
      ) : (
        <span className="font-medium text-brand-accent">frei</span>
      )}
    </li>
  );
}

function ManualBookingForm({
  isDateRanged,
  pending,
  onCancel,
  onSubmit,
}: {
  isDateRanged: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (data: {
    source: "TELEFON" | "VOR_ORT";
    guestName: string;
    guestPhone?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}) {
  return (
    <form
      className="flex flex-col gap-3 rounded-brand-md border border-brand-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const startDateRaw = String(form.get("startDate") ?? "");
        const endDateRaw = String(form.get("endDate") ?? "");
        onSubmit({
          source: form.get("source") === "VOR_ORT" ? "VOR_ORT" : "TELEFON",
          guestName: String(form.get("guestName") ?? ""),
          guestPhone: String(form.get("guestPhone") ?? "") || undefined,
          startDate: startDateRaw ? new Date(startDateRaw).toISOString() : undefined,
          endDate: endDateRaw ? new Date(endDateRaw).toISOString() : undefined,
        });
      }}
    >
      <p className="text-xs text-brand-text-muted">
        Ein freier Platz wird automatisch zugewiesen - du musst keinen bestimmten
        auswählen.
      </p>
      <div className="flex gap-4 text-sm text-brand-text">
        <label className="flex items-center gap-1">
          <input type="radio" name="source" value="TELEFON" defaultChecked /> Telefon
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" name="source" value="VOR_ORT" /> Vor Ort
        </label>
      </div>
      <input
        name="guestName"
        required
        placeholder="Name"
        className="rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
      <input
        name="guestPhone"
        placeholder="Telefon (optional)"
        className="rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
      {isDateRanged && (
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
            Von
            <input
              type="date"
              name="startDate"
              required
              className="rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
            Bis
            <input
              type="date"
              name="endDate"
              required
              className="rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Wird erfasst…" : "Platz belegen"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-brand-md border border-brand-border px-4 py-2 text-sm text-brand-text-muted"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
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
  const [showBookingForm, setShowBookingForm] = useState(false);
  const isDateRanged = dateRangedBookingTypes.includes(bookingType);

  const updatePricing = trpc.operator.updatePricing.useMutation();
  const setUnitCount = trpc.operator.setUnitCount.useMutation();
  const renameUnit = trpc.operator.renameUnit.useMutation();
  const createBooking = trpc.operator.createManualBooking.useMutation();
  const cancelBooking = trpc.operator.cancelBooking.useMutation();

  const totalUnits = units.length;
  const freeUnits = units.filter((u) => u.bookings.length === 0).length;

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
        <h3 className="font-semibold text-brand-primary-dark">
          {bookingTypeLabels[bookingType]}
        </h3>
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

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const monthlyPriceRaw = String(form.get("monthlyPrice") ?? "");
          const availableFromRaw = String(form.get("availableFrom") ?? "");
          runMutation(() =>
            updatePricing.mutateAsync({
              bookingType,
              monthlyPriceCents: monthlyPriceRaw
                ? Math.round(Number(monthlyPriceRaw) * 100)
                : undefined,
              availableFrom: availableFromRaw
                ? new Date(availableFromRaw).toISOString()
                : undefined,
            }),
          );
        }}
      >
        <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
          Monatlicher Heimpreis (€) - Familien sehen daneben automatisch
          ihren Eigenanteil nach Pflegekassen-Zuschuss
          <input
            type="number"
            name="monthlyPrice"
            min={0}
            step={10}
            defaultValue={
              capacity?.monthlyPriceCents != null ? capacity.monthlyPriceCents / 100 : ""
            }
            className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        {bookingType === "STATIONAERE_AUFNAHME" && (
          <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
            Nächster freier Platz ab (falls 0 frei)
            <input
              type="date"
              name="availableFrom"
              defaultValue={toDateInputValue(capacity?.availableFrom)}
              className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        )}
        <button
          type="submit"
          disabled={updatePricing.isPending}
          className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-background disabled:opacity-50"
        >
          {updatePricing.isPending ? "…" : "Preis speichern"}
        </button>
      </form>

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

      {units.length > 0 && (
        <ul className="flex flex-col gap-2">
          {units.map((unit) => (
            <UnitRow
              key={unit.id}
              unit={unit}
              cancelPending={cancelBooking.isPending}
              onRename={(label) =>
                runMutation(() => renameUnit.mutateAsync({ unitId: unit.id, label }))
              }
              onCancelBooking={(bookingId) =>
                runMutation(() => cancelBooking.mutateAsync({ bookingId }))
              }
            />
          ))}
        </ul>
      )}

      {showBookingForm ? (
        <ManualBookingForm
          isDateRanged={isDateRanged}
          pending={createBooking.isPending}
          onCancel={() => setShowBookingForm(false)}
          onSubmit={(data) =>
            runMutation(async () => {
              await createBooking.mutateAsync({ bookingType, ...data });
              setShowBookingForm(false);
            })
          }
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowBookingForm(true)}
          disabled={freeUnits === 0}
          className="self-start rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Buchung erfassen (Telefon/vor Ort)
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
