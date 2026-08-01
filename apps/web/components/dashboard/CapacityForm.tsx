"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import type { WeekdaySlots } from "@woodaa/validators";
import type { FacilityCapacity } from "@woodaa/api";

type BookingType = keyof typeof bookingTypeLabels;
type Capacity = FacilityCapacity;

const weekdayKeys: (keyof WeekdaySlots)[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];
const weekdayLabels: Record<keyof WeekdaySlots, string> = {
  mon: "Mo",
  tue: "Di",
  wed: "Mi",
  thu: "Do",
  fri: "Fr",
  sat: "Sa",
  sun: "So",
};

function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function CapacityForm({
  bookingType,
  existing,
}: {
  bookingType: BookingType;
  existing?: Capacity;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [weekday, setWeekday] = useState<WeekdaySlots>(
    (existing?.weekdaySlots as WeekdaySlots | undefined) ?? {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
    },
  );
  const updateCapacity = trpc.operator.updateCapacity.useMutation();

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const availableFromRaw = String(form.get("availableFrom") ?? "");

        try {
          await updateCapacity.mutateAsync({
            bookingType,
            totalSlots: Number(form.get("totalSlots")),
            availableSlots: Number(form.get("availableSlots")),
            availableFrom: availableFromRaw
              ? new Date(availableFromRaw).toISOString()
              : undefined,
            weekdaySlots:
              bookingType === "TAGES_NACHTPFLEGE" ? weekday : undefined,
          });
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
          );
        }
      }}
    >
      <h3 className="font-semibold text-brand-primary-dark">
        {bookingTypeLabels[bookingType]}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Plätze gesamt
          <input
            type="number"
            name="totalSlots"
            min={0}
            required
            defaultValue={existing?.totalSlots ?? 0}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Davon aktuell frei
          <input
            type="number"
            name="availableSlots"
            min={0}
            required
            defaultValue={existing?.availableSlots ?? 0}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      </div>

      {bookingType === "STATIONAERE_AUFNAHME" && (
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Nächster freier Platz ab (falls aktuell 0 frei)
          <input
            type="date"
            name="availableFrom"
            defaultValue={toDateInputValue(existing?.availableFrom)}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      )}

      {bookingType === "TAGES_NACHTPFLEGE" && (
        <div>
          <p className="mb-2 text-sm text-brand-text">
            Freie Plätze je Wochentag
          </p>
          <div className="grid grid-cols-7 gap-2">
            {weekdayKeys.map((day) => (
              <label
                key={day}
                className="flex flex-col items-center gap-1 text-xs text-brand-text-muted"
              >
                {weekdayLabels[day]}
                <input
                  type="number"
                  min={0}
                  value={weekday[day]}
                  onChange={(event) =>
                    setWeekday((prev) => ({
                      ...prev,
                      [day]: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-brand-md border border-brand-border px-2 py-1 text-center text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={updateCapacity.isPending}
        className="self-start rounded-brand-md bg-brand-accent px-5 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {updateCapacity.isPending ? "Wird gespeichert…" : "Speichern"}
      </button>
    </form>
  );
}
