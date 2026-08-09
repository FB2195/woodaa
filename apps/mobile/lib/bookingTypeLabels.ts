import type { BookingType } from "@woodaa/validators";

// Kept in sync with apps/web/lib/bookingTypeLabels.ts.
export const bookingTypeLabels: Record<BookingType, string> = {
  STATIONAERE_AUFNAHME: "Stationäre Aufnahme",
  KURZZEITPFLEGE: "Kurzzeitpflege",
  TAGESPFLEGE: "Tagespflege",
  NACHTPFLEGE: "Nachtpflege",
};

export const bookingTypeOptions = (Object.keys(bookingTypeLabels) as BookingType[]).map(
  (value) => ({ value, label: bookingTypeLabels[value] }),
);

// STATIONAERE_AUFNAHME ist unbefristet belegt (kein Zeitraum nötig);
// KURZZEITPFLEGE/TAGESPFLEGE/NACHTPFLEGE brauchen ein Start-/Enddatum.
export const dateRangedBookingTypes: BookingType[] = [
  "KURZZEITPFLEGE",
  "TAGESPFLEGE",
  "NACHTPFLEGE",
];

// Nur Tages-/Nachtpflege ist ihrer Natur nach regelmäßig/auf Weiteres
// buchbar (kein festes Enddatum nötig) - Kurzzeitpflege ist per Definition
// zeitlich begrenzt und braucht immer ein festes Enddatum.
export const openEndedBookingTypes: BookingType[] = ["TAGESPFLEGE", "NACHTPFLEGE"];
