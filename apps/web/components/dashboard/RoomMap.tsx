"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { dateRangedBookingTypes } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { computeUnitStatus, type UnitStatus } from "@/lib/unitStatus";
import { ResidentNotes } from "./ResidentNotes";
import type { BookingType } from "@woodaa/validators";
import type { FacilityUnit, UnitBooking } from "@woodaa/api";

type BookingWithVollmachtFlag = UnitBooking & {
  user: { vollmachtDocumentKey: string | null } | null;
};
type Unit = FacilityUnit & { bookings: BookingWithVollmachtFlag[] };

const sourceLabels: Record<UnitBooking["source"], string> = {
  ONLINE: "online",
  TELEFON: "Telefon",
  VOR_ORT: "vor Ort",
};

// Tailwind can't see classNames built from template strings at build time,
// so every color combination needed anywhere in this file has to appear
// here as a literal string - this map IS that full literal list.
const STATUS_STYLES: Record<
  UnitStatus,
  { tile: string; dot: string; badge: string; label: string }
> = {
  FREI: {
    tile: "border-emerald-300 bg-emerald-50 text-emerald-900 hover:border-emerald-400 hover:shadow-md dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    label: "Frei",
  },
  BELEGT: {
    tile: "border-red-300 bg-red-50 text-red-900 hover:border-red-400 hover:shadow-md dark:border-red-700 dark:bg-red-950/40 dark:text-red-200",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    label: "Belegt",
  },
  ANFRAGE: {
    tile: "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400 hover:shadow-md dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    label: "Anfrage offen",
  },
  RESERVIERT: {
    tile: "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400 hover:shadow-md dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    label: "Reserviert",
  },
};

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-brand-text-muted">
      {(Object.keys(STATUS_STYLES) as UnitStatus[])
        .filter((status) => status !== "ANFRAGE")
        .map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[status].dot}`} />
            {STATUS_STYLES[status].label}
            {status === "RESERVIERT" && " / Anfrage"}
          </span>
        ))}
      <span className="flex items-center gap-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[9px] font-bold text-white">
          +
        </span>
        Intensivpflege-geeignet
      </span>
    </div>
  );
}

function RoomTile({ unit, onSelect }: { unit: Unit; onSelect: () => void }) {
  const { status } = computeUnitStatus(unit.bookings);
  const styles = STATUS_STYLES[status];

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${unit.label} · ${styles.label}`}
      className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-brand-md border-2 p-2 text-center transition ${styles.tile}`}
    >
      {unit.isIntensivpflege && (
        <span
          aria-label="Intensivpflege-geeignet"
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white ring-2 ring-brand-surface"
        >
          +
        </span>
      )}
      <span className="line-clamp-2 break-words text-xs font-semibold leading-tight sm:text-sm">
        {unit.label}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-80 sm:text-xs">
        {styles.label}
      </span>
    </button>
  );
}

function DetailPanel({
  unit,
  bookingType,
  onClose,
}: {
  unit: Unit;
  bookingType: BookingType;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState(unit.label);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const isDateRanged = dateRangedBookingTypes.includes(bookingType);

  const updateUnit = trpc.operator.updateUnit.useMutation();
  const createBooking = trpc.operator.createManualBooking.useMutation();
  const cancelBookingMutation = trpc.operator.cancelBooking.useMutation();

  const { status, booking } = computeUnitStatus(unit.bookings);
  const styles = STATUS_STYLES[status];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details zu ${unit.label}`}
        className="flex max-h-[85vh] w-full flex-col gap-4 overflow-y-auto rounded-t-brand-lg border border-brand-border bg-brand-surface p-6 shadow-xl sm:max-w-md sm:rounded-brand-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = labelValue.trim();
              if (!trimmed) return;
              runMutation(() => updateUnit.mutateAsync({ unitId: unit.id, label: trimmed }));
            }}
          >
            <input
              value={labelValue}
              onChange={(event) => setLabelValue(event.target.value)}
              className="w-full rounded-brand-md border border-brand-border bg-transparent px-2 py-1 text-lg font-bold text-brand-heading focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            {labelValue.trim() !== unit.label && (
              <button type="submit" className="shrink-0 text-brand-accent" title="Speichern">
                ✓
              </button>
            )}
          </form>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="shrink-0 rounded-brand-md p-1 text-brand-text-muted hover:text-brand-text"
          >
            ✕
          </button>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-brand-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
        >
          <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
          {styles.label}
        </span>

        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input
            type="checkbox"
            checked={unit.isIntensivpflege}
            disabled={updateUnit.isPending}
            onChange={(event) =>
              runMutation(() =>
                updateUnit.mutateAsync({
                  unitId: unit.id,
                  label: unit.label,
                  isIntensivpflege: event.target.checked,
                }),
              )
            }
          />
          Intensivpflege-geeignet (Beatmung/Monitoring-Technik vorhanden)
        </label>

        {booking ? (
          <div className="flex flex-col gap-3 rounded-brand-md border border-brand-border bg-brand-background p-4 text-sm">
            <div>
              <p className="font-medium text-brand-text">
                {booking.guestName ?? "Ohne Namen erfasst"}
              </p>
              <p className="mt-0.5 text-brand-text-muted">
                Erfasst {sourceLabels[booking.source]}
                {booking.startDate &&
                  ` · ab ${formatDate(booking.startDate)}${
                    booking.endDate ? ` bis ${formatDate(booking.endDate)}` : " (Ende offen)"
                  }`}
              </p>
              {booking.user?.vollmachtDocumentKey && (
                <span className="mt-1 inline-block rounded-brand-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Bevollmächtigte/r Angehörige/r
                </span>
              )}
              {status === "ANFRAGE" && (
                <p className="mt-2 text-amber-700 dark:text-amber-400">
                  Diese Buchung wartet noch auf eure Freigabe/Ablehnung - das entscheidet ihr auf
                  der Seite "Buchungen".
                </p>
              )}
            </div>
            <ResidentNotes bookingId={booking.id} />
            {status !== "ANFRAGE" && (
              <button
                type="button"
                disabled={cancelBookingMutation.isPending}
                onClick={() =>
                  runMutation(async () => {
                    await cancelBookingMutation.mutateAsync({ bookingId: booking.id });
                    onClose();
                  })
                }
                className="self-start text-brand-text-muted hover:text-red-600 disabled:opacity-50"
              >
                Buchung stornieren
              </button>
            )}
          </div>
        ) : showBookingForm ? (
          <form
            className="flex flex-col gap-3 rounded-brand-md border border-brand-border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const startDateRaw = String(form.get("startDate") ?? "");
              const endDateRaw = String(form.get("endDate") ?? "");
              runMutation(async () => {
                await createBooking.mutateAsync({
                  bookingType,
                  source: form.get("source") === "VOR_ORT" ? "VOR_ORT" : "TELEFON",
                  guestName: String(form.get("guestName") ?? ""),
                  guestPhone: String(form.get("guestPhone") ?? "") || undefined,
                  startDate: startDateRaw ? new Date(startDateRaw).toISOString() : undefined,
                  endDate: endDateRaw ? new Date(endDateRaw).toISOString() : undefined,
                });
                onClose();
              });
            }}
          >
            <p className="text-xs text-brand-text-muted">
              Ein freier Platz in dieser Kategorie wird automatisch zugewiesen - nicht zwingend
              genau {unit.label}.
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
                disabled={createBooking.isPending}
                className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {createBooking.isPending ? "Wird erfasst…" : "Platz belegen"}
              </button>
              <button
                type="button"
                onClick={() => setShowBookingForm(false)}
                className="rounded-brand-md border border-brand-border px-4 py-2 text-sm text-brand-text-muted"
              >
                Abbrechen
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowBookingForm(true)}
            className="self-start rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Buchung erfassen (Telefon/vor Ort)
          </button>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export function RoomMap({ bookingType, units }: { bookingType: BookingType; units: Unit[] }) {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const selectedUnit = units.find((u) => u.id === selectedUnitId) ?? null;

  if (units.length === 0) {
    return (
      <p className="text-sm text-brand-text-muted">
        Noch keine Plätze angelegt - trag oben ein, wie viele Plätze es in dieser Kategorie gibt.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Legend />
      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-6">
        {units.map((unit) => (
          <RoomTile key={unit.id} unit={unit} onSelect={() => setSelectedUnitId(unit.id)} />
        ))}
      </div>
      {selectedUnit && (
        <DetailPanel
          unit={selectedUnit}
          bookingType={bookingType}
          onClose={() => setSelectedUnitId(null)}
        />
      )}
    </div>
  );
}
