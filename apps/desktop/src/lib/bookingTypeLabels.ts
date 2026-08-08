import type { BookingType } from "@woodaa/validators";

// Kept in sync with apps/web/lib/bookingTypeLabels.ts.
export const bookingTypeLabels: Record<BookingType, string> = {
  STATIONAERE_AUFNAHME: "Stationäre Aufnahme",
  KURZZEITPFLEGE: "Kurzzeitpflege",
  TAGESPFLEGE: "Tagespflege",
  NACHTPFLEGE: "Nachtpflege",
};

export const bookingTypeOrder: BookingType[] = [
  "STATIONAERE_AUFNAHME",
  "KURZZEITPFLEGE",
  "TAGESPFLEGE",
  "NACHTPFLEGE",
];

// STATIONAERE_AUFNAHME is occupied indefinitely once booked (no date range,
// so a day-by-day timeline adds nothing) - the other three have a
// start/end date worth visualizing on a calendar axis.
export const dateRangedBookingTypes: BookingType[] = [
  "KURZZEITPFLEGE",
  "TAGESPFLEGE",
  "NACHTPFLEGE",
];
