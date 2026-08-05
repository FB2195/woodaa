import type { BookingType } from "@woodaa/validators";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type PflegegradRate = {
  dailyRateCents: number | null;
  monthlyRateCents: number | null;
  hourlyRateCents: number | null;
};

function daysInRange(startDate: Date | null, endDate: Date | null): number | null {
  if (!startDate || !endDate) return null;
  return Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
}

// The amount actually charged upfront via Stripe (KARTE/KLARNA/PAYPAL) at
// booking time - always the full Heimpreis for the period, never the
// Pflegekasse-subsidized Eigenanteil (families pay in advance and get
// reimbursed by their Kasse afterward, see the booking form's hint text).
//
// Computed server-side from the trusted per-Pflegegrad rate (DB) and the
// booking's actual start/end dates/hoursPerDay, deliberately NOT from a
// client-supplied day/hour count - a tampered value could otherwise
// underpay for a booking whose real period is longer.
//
// STATIONAERE_AUFNAHME and open-ended ("Ende offen", endDate === null)
// bookings both charge exactly one month upfront as a reservation/first
// payment - true recurring billing for the following months is out of
// scope for this MVP and stays a direct arrangement between family and
// Einrichtung, the same simplification as desiredStartDate being purely
// informational (see schema.prisma). Returns null when the facility
// hasn't entered a usable rate for this Pflegegrad/bookingType - callers
// must not silently charge 0 in that case.
export function chargeAmountCents(
  bookingType: BookingType,
  rate: PflegegradRate | undefined,
  startDate: Date | null,
  endDate: Date | null,
  hoursPerDay: number | null,
): number | null {
  if (!rate) return null;
  const days = daysInRange(startDate, endDate);

  if (bookingType === "STATIONAERE_AUFNAHME") {
    if (rate.monthlyRateCents !== null) return rate.monthlyRateCents;
    if (rate.dailyRateCents !== null) return rate.dailyRateCents * 30;
    return null;
  }

  if (bookingType === "KURZZEITPFLEGE") {
    if (rate.dailyRateCents === null) return null;
    return Math.round(rate.dailyRateCents * (days ?? 30));
  }

  // TAGESPFLEGE / NACHTPFLEGE
  if (rate.hourlyRateCents === null || !hoursPerDay) return null;
  return Math.round(rate.hourlyRateCents * hoursPerDay * (days ?? 30));
}
