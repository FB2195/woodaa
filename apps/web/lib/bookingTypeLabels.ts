import type { BookingType } from "@woodaa/validators";

export const bookingTypeLabels: Record<BookingType, string> = {
  STATIONAERE_AUFNAHME: "Stationäre Aufnahme",
  KURZZEITPFLEGE: "Kurzzeitpflege",
  TAGES_NACHTPFLEGE: "Tages- & Nachtpflege",
};

export const bookingTypeOptions = (
  Object.keys(bookingTypeLabels) as BookingType[]
).map((value) => ({ value, label: bookingTypeLabels[value] }));
