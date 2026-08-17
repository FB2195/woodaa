import type { BookingType } from "@woodaa/validators";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Client-side preview of packages/api/src/availability.ts's
// isWithinFreeCancellationWindow (kept in sync manually, same logic) - only
// used to show the customer whether cancelling now would still be refunded
// before they confirm, never as the actual authority: the server
// independently re-checks this in myCancel/cancel regardless of what the
// client displays.
export function isWithinFreeCancellationWindow(
  booking: {
    bookingType: BookingType;
    startDate: Date | string | null;
    desiredStartDate: Date | string | null;
    createdAt: Date | string;
  },
  cancellationPolicyDays: number | null,
  now: Date,
): boolean {
  if (cancellationPolicyDays === null) return true;
  const startDate = booking.startDate ? new Date(booking.startDate) : null;
  const desiredStartDate = booking.desiredStartDate ? new Date(booking.desiredStartDate) : null;
  const createdAt = new Date(booking.createdAt);
  const referenceDate =
    booking.bookingType === "STATIONAERE_AUFNAHME"
      ? (desiredStartDate ?? createdAt)
      : (startDate ?? createdAt);
  const daysUntilStart = Math.round(
    (startOfDay(referenceDate).getTime() - startOfDay(now).getTime()) / MS_PER_DAY,
  );
  return daysUntilStart >= cancellationPolicyDays;
}
