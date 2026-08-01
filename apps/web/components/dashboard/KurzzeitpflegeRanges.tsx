"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import type { KurzzeitpflegeBooking } from "@woodaa/api";

type Booking = KurzzeitpflegeBooking;

export function KurzzeitpflegeRanges({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const addRange = trpc.operator.addOccupiedRange.useMutation();
  const removeRange = trpc.operator.removeOccupiedRange.useMutation();

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <h3 className="font-semibold text-brand-primary-dark">
        Belegte Zeiträume (Kurzzeitpflege)
      </h3>

      {bookings.length === 0 ? (
        <p className="text-sm text-brand-text-muted">
          Aktuell keine belegten Zeiträume eingetragen.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="flex items-center justify-between rounded-brand-md border border-brand-border px-3 py-2 text-sm"
            >
              <span className="text-brand-text">
                {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
              </span>
              <button
                type="button"
                disabled={removeRange.isPending}
                onClick={async () => {
                  setError(null);
                  try {
                    await removeRange.mutateAsync({ id: booking.id });
                    router.refresh();
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Da ist etwas schiefgelaufen.",
                    );
                  }
                }}
                className="text-brand-text-muted hover:text-red-600"
              >
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);
          const startDate = String(form.get("startDate") ?? "");
          const endDate = String(form.get("endDate") ?? "");

          try {
            await addRange.mutateAsync({
              startDate: new Date(startDate).toISOString(),
              endDate: new Date(endDate).toISOString(),
            });
            event.currentTarget.reset();
            router.refresh();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
            );
          }
        }}
      >
        <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
          Von
          <input
            type="date"
            name="startDate"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
          Bis
          <input
            type="date"
            name="endDate"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <button
          type="submit"
          disabled={addRange.isPending}
          className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {addRange.isPending ? "Wird gespeichert…" : "Hinzufügen"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
