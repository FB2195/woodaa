"use client";

import type { UnitBooking } from "@woodaa/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/paymentMethodLabels";
import { trpc } from "@/lib/trpc";

function ApprovalRow({ booking }: { booking: UnitBooking }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const approve = trpc.operator.approveBookingPayment.useMutation();
  const reject = trpc.operator.rejectBookingPayment.useMutation();
  const downloadUrl = trpc.operator.kostenuebernahmeDownloadUrl.useQuery(
    { bookingId: booking.id },
    { enabled: false, retry: false },
  );

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  const pending = approve.isPending || reject.isPending;

  return (
    <li className="flex flex-col gap-2 rounded-brand-md border border-brand-border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-brand-text">
            {booking.guestName ?? `${booking.guestFirstName} ${booking.guestLastName}`.trim()}
          </p>
          <p className="text-brand-text-muted">
            {bookingTypeLabels[booking.bookingType]} · {paymentMethodLabels[booking.paymentMethod!]}
            {booking.startDate && ` · ab ${formatDate(booking.startDate)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {booking.kostenuebernahmeDocumentKey && (
            <button
              type="button"
              onClick={async () => {
                setError(null);
                const result = await downloadUrl.refetch();
                if (result.data?.url) window.open(result.data.url, "_blank");
              }}
              className="rounded-brand-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text hover:bg-brand-background"
            >
              Beleg ansehen
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => approve.mutateAsync({ bookingId: booking.id }))}
            className="rounded-brand-md bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Freigeben
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
      {booking.paymentMethod === "KOSTENUEBERNAHME_KASSE" && !booking.kostenuebernahmeDocumentKey && (
        <p className="text-xs text-brand-text-muted">
          Wartet noch auf den Upload der Kostenübernahmebestätigung durch die Familie.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}

// Bookings paid via RECHNUNG or KOSTENUEBERNAHME_KASSE need the facility's
// explicit "Go" before they count as payment-confirmed - see
// paymentStatus/PaymentMethod in schema.prisma.
export function PaymentApprovals({ bookings }: { bookings: UnitBooking[] }) {
  const pending = bookings.filter((b) => b.paymentStatus === "WARTET_AUF_HEIM_FREIGABE");

  if (pending.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <h3 className="font-semibold text-brand-primary-dark">
        Zahlungsfreigaben ({pending.length})
      </h3>
      <p className="text-sm text-brand-text-muted">
        Diese Buchungen werden per Rechnung oder Kostenübernahme durch die Pflegekasse
        bezahlt - bitte prüfen und freigeben oder ablehnen.
      </p>
      <ul className="flex flex-col gap-3">
        {pending.map((booking) => (
          <ApprovalRow key={booking.id} booking={booking} />
        ))}
      </ul>
    </div>
  );
}
