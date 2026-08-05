import type { BookingType, FacilitySearchInput } from "@woodaa/validators";
import type { PrismaClient } from "@prisma/client";
import {
  computeWeekdayAvailability,
  findNextAvailableRangeStart,
  hasFreeUnitForRange,
} from "./availability";

export type AvailabilityAnnotation = {
  // null = not applicable (no bookingType selected) - distinct from false,
  // which means "checked, not free right now".
  isAvailableForRequest: boolean | null;
  availabilityNote: string | null;
};

const NOT_APPLICABLE: AvailabilityAnnotation = {
  isAvailableForRequest: null,
  availabilityNote: null,
};

const AVAILABLE: AvailabilityAnnotation = { isAvailableForRequest: true, availabilityNote: null };

function formatDateDE(date: Date): string {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const WEEKDAY_LABELS: Record<number, string> = {
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa",
  7: "So",
};

// Per-facility "is this actually available" check for the selected
// bookingType. Two modes:
// - A matching date/time filter was given (availableFromDate/rangeStart+
//   rangeEnd/weekdays) -> precise check against that request, with a
//   day-by-day lookahead scan for a suggested alternative when it's a no.
// - No date/time filter, just a bookingType - falls back to "does it have
//   any free slot right now" (hasFreeSlotNow, already computed by the
//   caller from FacilityCapacity). This is what makes the "Nur freie
//   Pflegeplätze anzeigen" toggle's off-state show a red "ausgebucht" tag
//   on facilities that only got past the pool filter because the toggle
//   let zero-capacity ones through - see matchesBookingType in the router.
// Either way, a facility with a free slot right now is never flagged
// unavailable just because a specific request wasn't fully checked -
// hasFreeSlotNow short-circuits every branch below.
export async function checkRequestedAvailability(
  db: PrismaClient,
  facilityId: string,
  bookingType: BookingType | undefined,
  input: FacilitySearchInput,
  hasFreeSlotNow: boolean,
  availableFromCache: Date | null,
): Promise<AvailabilityAnnotation> {
  if (!bookingType) return NOT_APPLICABLE;
  if (hasFreeSlotNow) return AVAILABLE;

  if (bookingType === "STATIONAERE_AUFNAHME") {
    // Even without a specific requested date, FacilityCapacity.availableFrom
    // is already precomputed - free to use as the suggestion.
    if (availableFromCache && (!input.availableFromDate || availableFromCache <= input.availableFromDate)) {
      return {
        isAvailableForRequest: true,
        availabilityNote: null,
      };
    }
    return {
      isAvailableForRequest: false,
      availabilityNote: availableFromCache
        ? `Aktuell ausgebucht - voraussichtlich ab ${formatDateDE(availableFromCache)}`
        : "Aktuell ausgebucht",
    };
  }

  if (bookingType === "KURZZEITPFLEGE") {
    if (input.rangeStart && input.rangeEnd) {
      const free = await hasFreeUnitForRange(
        db,
        facilityId,
        bookingType,
        input.rangeStart,
        input.rangeEnd,
      );
      if (free) return AVAILABLE;

      const durationDays =
        Math.round((input.rangeEnd.getTime() - input.rangeStart.getTime()) / (24 * 60 * 60 * 1000)) +
        1;
      const nextStart = await findNextAvailableRangeStart(
        db,
        facilityId,
        bookingType,
        Math.max(durationDays, 1),
        input.rangeEnd,
      );
      return {
        isAvailableForRequest: false,
        availabilityNote: nextStart
          ? `Aktuell ausgebucht - nächster möglicher Zeitraum ab ${formatDateDE(nextStart)}`
          : "Aktuell ausgebucht",
      };
    }
    return { isAvailableForRequest: false, availabilityNote: "Aktuell ausgebucht" };
  }

  // TAGESPFLEGE / NACHTPFLEGE
  if (input.weekdays && input.weekdays.length > 0) {
    const { available, nextFullyAvailableDate } = await computeWeekdayAvailability(
      db,
      facilityId,
      bookingType,
      input.weekdays,
      new Date(),
    );
    if (available) return AVAILABLE;

    const weekdayLabel = input.weekdays.map((w) => WEEKDAY_LABELS[w]).join("/");
    return {
      isAvailableForRequest: false,
      availabilityNote: nextFullyAvailableDate
        ? `Aktuell nicht für ${weekdayLabel} verfügbar - voraussichtlich ab ${formatDateDE(nextFullyAvailableDate)}`
        : `Aktuell nicht für ${weekdayLabel} verfügbar`,
    };
  }
  return { isAvailableForRequest: false, availabilityNote: "Aktuell ausgebucht" };
}
