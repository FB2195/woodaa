"use client";

import Link from "next/link";
import { useState } from "react";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/paymentMethodLabels";
import { trpc } from "@/lib/trpc";
// Type-only import - erased at build time, safe to pull into a client
// component despite trpc-server.ts otherwise being server-only. Reflects
// the client's post-JSON-serialization shape (stringified dates), unlike
// the Date-typed MyBooking exported from @woodaa/api - see BookingForm.tsx
// for the same distinction.
import type { RouterOutputs } from "@/lib/trpc-server";

type MyBooking = RouterOutputs["booking"]["myBookings"][number];

const paymentStatusLabels: Record<string, string> = {
  AUSSTEHEND: "Zahlung ausstehend",
  BEZAHLT: "Bezahlt",
  WARTET_AUF_HEIM_FREIGABE: "Wartet auf Freigabe der Einrichtung",
  FREIGEGEBEN: "Freigegeben",
  ABGELEHNT: "Zahlung abgelehnt",
};

const facilityApprovalLabels: Record<string, { text: string; className: string }> = {
  AUSSTEHEND: {
    text: "Bestätigung durch die Einrichtung ausstehend",
    className: "bg-amber-100 text-amber-700",
  },
  BESTAETIGT: {
    text: "Von der Einrichtung bestätigt",
    className: "bg-brand-accent/10 text-brand-accent",
  },
  ABGELEHNT: {
    text: "Von der Einrichtung abgelehnt",
    className: "bg-red-100 text-red-700",
  },
};

function BookingRow({ booking }: { booking: MyBooking }) {
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const cancel = trpc.booking.myCancel.useMutation();

  const isCancelled = booking.status === "STORNIERT";
  const facilityApproval =
    booking.facilityApprovalStatus !== "NICHT_ERFORDERLICH"
      ? facilityApprovalLabels[booking.facilityApprovalStatus]
      : null;

  async function handleCancel() {
    setError(null);
    try {
      await cancel.mutateAsync({ bookingId: booking.id });
      await utils.booking.myBookings.invalidate();
      setConfirmingCancel(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-brand-md border border-brand-border p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-brand-text">
            <Link href={`/einrichtung/${booking.facility.slug}`} className="hover:underline">
              {booking.facility.name}
            </Link>
          </p>
          <p className="text-brand-text-muted">
            {booking.facility.street}, {booking.facility.postalCode} {booking.facility.city}
          </p>
          <p className="mt-1 text-brand-text-muted">
            {bookingTypeLabels[booking.bookingType]}
            {booking.guestFirstName &&
              ` · ${booking.guestFirstName} ${booking.guestLastName ?? ""}`.trimEnd()}
          </p>
          {booking.startDate && (
            <p className="text-brand-text-muted">
              {formatDate(booking.startDate)}
              {booking.endDate
                ? ` bis ${formatDate(booking.endDate)}`
                : booking.bookingType !== "STATIONAERE_AUFNAHME"
                  ? " (ohne Enddatum)"
                  : ""}
            </p>
          )}
          {booking.desiredStartDate && (
            <p className="text-brand-text-muted">
              Gewünschter Einzug: {formatDate(booking.desiredStartDate)}
            </p>
          )}
          {booking.paymentMethod && (
            <p className="text-brand-text-muted">
              {paymentMethodLabels[booking.paymentMethod]}
              {booking.paymentStatus &&
                ` · ${paymentStatusLabels[booking.paymentStatus] ?? booking.paymentStatus}`}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {isCancelled ? (
            <span className="rounded-brand-full bg-brand-border px-2 py-0.5 text-xs font-medium text-brand-text-muted">
              Storniert
            </span>
          ) : (
            facilityApproval && (
              <span
                className={`rounded-brand-full px-2 py-0.5 text-xs font-medium ${facilityApproval.className}`}
              >
                {facilityApproval.text}
              </span>
            )
          )}

          {!isCancelled &&
            (confirmingCancel ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={cancel.isPending}
                  onClick={handleCancel}
                  className="rounded-brand-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {cancel.isPending ? "Storniere…" : "Wirklich stornieren"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  className="rounded-brand-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text-muted"
                >
                  Zurück
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                className="rounded-brand-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text-muted hover:text-red-600"
              >
                Stornieren
              </button>
            ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}

export function MyBookingsSection() {
  const { data, isLoading } = trpc.booking.myBookings.useQuery();

  if (isLoading || !data) return null;

  return (
    <div className="mt-10 border-t border-brand-border pt-8">
      <h2 className="text-lg font-semibold text-brand-text">Meine Buchungen</h2>

      {data.length === 0 ? (
        <p className="mt-2 text-sm text-brand-text-muted">
          Du hast noch keine Buchung vorgenommen.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {data.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </ul>
      )}
    </div>
  );
}
