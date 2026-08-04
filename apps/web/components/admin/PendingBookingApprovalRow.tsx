"use client";

import type { AdminPendingBookingApproval } from "@woodaa/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/paymentMethodLabels";
import { trpc } from "@/lib/trpc";

const vollmachtStatusLabels: Record<"AUSSTEHEND" | "GEPRUEFT" | "ABGELEHNT", string> = {
  AUSSTEHEND: "Vollmacht noch ungeprüft",
  GEPRUEFT: "Vollmacht geprüft",
  ABGELEHNT: "Vollmacht abgelehnt",
};

export function PendingBookingApprovalRow({
  booking,
}: {
  booking: AdminPendingBookingApproval;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const approve = trpc.admin.approveBookingAdmin.useMutation();
  const reject = trpc.admin.rejectBookingAdmin.useMutation();
  const pending = approve.isPending || reject.isPending;

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  const vollmachtStatus = booking.user?.vollmachtReviewStatus;

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-primary-dark">
            {booking.guestFirstName} {booking.guestLastName}
          </h3>
          <p className="text-sm text-brand-text-muted">
            {bookingTypeLabels[booking.bookingType]} bei {booking.facility.name} ·{" "}
            {paymentMethodLabels[booking.paymentMethod!]}
            {booking.startDate && ` · ab ${formatDate(booking.startDate)}`}
          </p>
          <p className="mt-1 text-sm text-brand-text-muted">
            Gebucht von {booking.user?.name} ({booking.user?.email})
          </p>
          {vollmachtStatus && (
            <p
              className={`mt-1 text-xs font-medium ${
                vollmachtStatus === "GEPRUEFT"
                  ? "text-brand-accent"
                  : vollmachtStatus === "ABGELEHNT"
                    ? "text-red-600"
                    : "text-amber-600"
              }`}
            >
              {vollmachtStatusLabels[vollmachtStatus]}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => approve.mutateAsync({ bookingId: booking.id }))}
            className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Freigeben
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => reject.mutateAsync({ bookingId: booking.id }))}
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
