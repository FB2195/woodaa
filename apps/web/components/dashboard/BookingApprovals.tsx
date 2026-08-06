"use client";

import type { UnitBooking } from "@woodaa/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";

function ApprovalRow({ booking }: { booking: UnitBooking }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const confirm = trpc.operator.confirmBooking.useMutation();
  const reject = trpc.operator.rejectBooking.useMutation();
  const pending = confirm.isPending || reject.isPending;

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
    <li className="flex flex-col gap-2 rounded-brand-md border border-brand-border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-brand-text">
            {booking.guestName ?? `${booking.guestFirstName} ${booking.guestLastName}`.trim()}
          </p>
          <p className="text-brand-text-muted">
            {bookingTypeLabels[booking.bookingType]}
            {booking.startDate && ` · ab ${formatDate(booking.startDate)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => confirm.mutateAsync({ bookingId: booking.id }))}
            className="rounded-brand-md bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Bestätigen
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => reject.mutateAsync({ bookingId: booking.id }))}
            className="rounded-brand-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text-muted hover:text-red-600 disabled:opacity-50"
          >
            Ablehnen
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}

// Nur relevant, wenn bookingApprovalMode=MANUELL eingestellt ist/war - siehe
// BookingApprovalModeForm für die Einstellung selbst.
export function BookingApprovals({ bookings }: { bookings: UnitBooking[] }) {
  const pending = bookings.filter((b) => b.facilityApprovalStatus === "AUSSTEHEND");

  if (pending.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <h3 className="font-semibold text-brand-heading">
        Buchungsbestätigungen ({pending.length})
      </h3>
      <p className="text-sm text-brand-text-muted">
        Diese Online-Buchungen warten auf deine Bestätigung, bevor sie für die
        Familie als angenommen gelten.
      </p>
      <ul className="flex flex-col gap-3">
        {pending.map((booking) => (
          <ApprovalRow key={booking.id} booking={booking} />
        ))}
      </ul>
    </div>
  );
}
