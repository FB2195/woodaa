import { describe, expect, it } from "vitest";
import { isWithinFreeCancellationWindow } from "./availability";

const baseBooking = {
  bookingType: "KURZZEITPFLEGE" as const,
  startDate: null as Date | null,
  desiredStartDate: null as Date | null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

describe("isWithinFreeCancellationWindow", () => {
  it("always refunds when the facility hasn't set a cancellation policy", () => {
    const booking = { ...baseBooking, startDate: new Date("2026-01-02T00:00:00Z") };
    const now = new Date("2026-06-01T00:00:00Z"); // long after the stay already started
    expect(isWithinFreeCancellationWindow(booking, null, now)).toBe(true);
  });

  it("refunds when cancelling exactly on the policy deadline", () => {
    const booking = { ...baseBooking, startDate: new Date("2026-01-15T00:00:00Z") };
    const now = new Date("2026-01-10T00:00:00Z"); // exactly 5 days before
    expect(isWithinFreeCancellationWindow(booking, 5, now)).toBe(true);
  });

  it("refunds when cancelling well before the deadline", () => {
    const booking = { ...baseBooking, startDate: new Date("2026-01-15T00:00:00Z") };
    const now = new Date("2026-01-01T00:00:00Z");
    expect(isWithinFreeCancellationWindow(booking, 5, now)).toBe(true);
  });

  it("does not refund when cancelling one day past the deadline", () => {
    const booking = { ...baseBooking, startDate: new Date("2026-01-15T00:00:00Z") };
    const now = new Date("2026-01-11T00:00:00Z"); // only 4 days before, policy needs 5
    expect(isWithinFreeCancellationWindow(booking, 5, now)).toBe(false);
  });

  it("does not refund when cancelling after the stay has already started", () => {
    const booking = { ...baseBooking, startDate: new Date("2026-01-01T00:00:00Z") };
    const now = new Date("2026-01-10T00:00:00Z");
    expect(isWithinFreeCancellationWindow(booking, 5, now)).toBe(false);
  });

  it("uses desiredStartDate (not startDate) as the reference for STATIONAERE_AUFNAHME", () => {
    const booking = {
      ...baseBooking,
      bookingType: "STATIONAERE_AUFNAHME" as const,
      startDate: null, // STATIONAERE_AUFNAHME bookings have no fixed startDate
      desiredStartDate: new Date("2026-02-01T00:00:00Z"),
    };
    const now = new Date("2026-01-01T00:00:00Z"); // 31 days before desiredStartDate
    expect(isWithinFreeCancellationWindow(booking, 14, now)).toBe(true);
  });

  it("treats a STATIONAERE_AUFNAHME booking with no desiredStartDate as immediately occupied - no free window", () => {
    const booking = {
      ...baseBooking,
      bookingType: "STATIONAERE_AUFNAHME" as const,
      startDate: null,
      desiredStartDate: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    };
    // Cancelling the same day it was created/booked - falls back to
    // createdAt, so 0 days until "start", which fails any real deadline.
    const now = new Date("2026-01-01T00:00:00Z");
    expect(isWithinFreeCancellationWindow(booking, 14, now)).toBe(false);
  });

  it("a zero-day policy only refunds up to and including the start date itself", () => {
    const booking = { ...baseBooking, startDate: new Date("2026-01-10T00:00:00Z") };
    expect(isWithinFreeCancellationWindow(booking, 0, new Date("2026-01-10T00:00:00Z"))).toBe(true);
    expect(isWithinFreeCancellationWindow(booking, 0, new Date("2026-01-11T00:00:00Z"))).toBe(
      false,
    );
  });
});
