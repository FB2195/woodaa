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
