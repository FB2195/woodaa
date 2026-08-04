import type { BookingType } from "@woodaa/validators";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// The amount actually charged upfront via Stripe (KARTE/KLARNA/PAYPAL) at
// booking time - always the full Heimpreis for the period, never the
// Pflegekasse-subsidized Eigenanteil (families pay in advance and get
// reimbursed by their Kasse afterward, see the booking form's hint text).
//
// Computed server-side from the trusted monthlyPriceCents (DB) and the
// booking's actual start/end dates, deliberately NOT from a client-supplied
// "days" number - a tampered day count could otherwise underpay for a
// booking whose real date range is longer.
//
// STATIONAERE_AUFNAHME and open-ended ("Ende offen", endDate === null)
// bookings both charge exactly one month upfront as a reservation/first
// payment - true recurring billing for the following months is out of
// scope for this MVP and stays a direct arrangement between family and
// Einrichtung, the same simplification as desiredStartDate being purely
// informational (see schema.prisma).
export function chargeAmountCents(
  bookingType: BookingType,
  monthlyPriceCents: number,
  startDate: Date | null,
  endDate: Date | null,
): number {
  if (bookingType === "STATIONAERE_AUFNAHME" || !startDate || !endDate) {
    return monthlyPriceCents;
  }
  const days = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
  return Math.round((monthlyPriceCents / 30) * Math.max(1, days));
}
