import { db } from "@woodaa/db";
import { TRPCError } from "@trpc/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { cancelBooking, createBooking } from "./availability";
import { createTestFacilityWithUnit, resetTestDb } from "./testDb";

// Verifies the platform's core promise (see the comment on Booking in
// schema.prisma): overlapping active bookings on the same unit are
// impossible, enforced by a Postgres EXCLUDE constraint, not application
// code. If a future migration ever weakens/drops that constraint, this
// test should start failing (two bookings would both succeed) rather than
// silently allowing double-booking in production.
describe("createBooking - double-booking prevention", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("lets two bookings share a bookingType/facility when there are two free units", async () => {
    const { facility, unit } = await createTestFacilityWithUnit("STATIONAERE_AUFNAHME");
    await db.facilityUnit.create({
      data: { facilityId: facility.id, bookingType: "STATIONAERE_AUFNAHME", label: "Zimmer 2" },
    });

    const first = await createBooking(db, {
      facilityId: facility.id,
      bookingType: "STATIONAERE_AUFNAHME",
      source: "TELEFON",
      guestName: "Erste Person",
    });
    const second = await createBooking(db, {
      facilityId: facility.id,
      bookingType: "STATIONAERE_AUFNAHME",
      source: "TELEFON",
      guestName: "Zweite Person",
    });

    expect(first.unitId).not.toBe(second.unitId);
    expect([first.unitId, second.unitId].sort()).toEqual(
      (await db.facilityUnit.findMany({ where: { facilityId: facility.id } }))
        .map((u) => u.id)
        .sort(),
    );
    expect(unit.id === first.unitId || unit.id === second.unitId).toBe(true);
  });

  it("rejects a third booking once every unit for that bookingType is occupied", async () => {
    const { facility } = await createTestFacilityWithUnit("STATIONAERE_AUFNAHME");

    await createBooking(db, {
      facilityId: facility.id,
      bookingType: "STATIONAERE_AUFNAHME",
      source: "TELEFON",
      guestName: "Belegt",
    });

    await expect(
      createBooking(db, {
        facilityId: facility.id,
        bookingType: "STATIONAERE_AUFNAHME",
        source: "TELEFON",
        guestName: "Zu viel",
      }),
    ).rejects.toThrow(TRPCError);
  });

  it("frees the unit for a new booking once the original one is cancelled", async () => {
    const { facility } = await createTestFacilityWithUnit("STATIONAERE_AUFNAHME");

    const original = await createBooking(db, {
      facilityId: facility.id,
      bookingType: "STATIONAERE_AUFNAHME",
      source: "TELEFON",
      guestName: "Erste Person",
    });
    await cancelBooking(db, original.id);

    const replacement = await createBooking(db, {
      facilityId: facility.id,
      bookingType: "STATIONAERE_AUFNAHME",
      source: "TELEFON",
      guestName: "Zweite Person",
    });

    expect(replacement.unitId).toBe(original.unitId);
    expect(replacement.status).toBe("BESTAETIGT");

    const cancelled = await db.booking.findUniqueOrThrow({ where: { id: original.id } });
    expect(cancelled.status).toBe("STORNIERT");
  });

  it("allows overlapping date-ranged bookings on different units, rejects them on the same unit", async () => {
    const { facility, unit } = await createTestFacilityWithUnit("KURZZEITPFLEGE");
    const otherUnit = await db.facilityUnit.create({
      data: { facilityId: facility.id, bookingType: "KURZZEITPFLEGE", label: "Zimmer 2" },
    });

    const startDate = new Date("2026-05-01T00:00:00Z");
    const endDate = new Date("2026-05-05T00:00:00Z");

    await createBooking(db, {
      facilityId: facility.id,
      bookingType: "KURZZEITPFLEGE",
      source: "TELEFON",
      startDate,
      endDate,
      guestName: "Erste Person",
    });

    // Overlapping range, but there's still a second free unit - must succeed.
    const secondBooking = await createBooking(db, {
      facilityId: facility.id,
      bookingType: "KURZZEITPFLEGE",
      source: "TELEFON",
      startDate: new Date("2026-05-03T00:00:00Z"),
      endDate: new Date("2026-05-06T00:00:00Z"),
      guestName: "Zweite Person",
    });
    expect(secondBooking.unitId).toBe(otherUnit.id);

    // A third overlapping booking has nowhere left to go - both units taken.
    await expect(
      createBooking(db, {
        facilityId: facility.id,
        bookingType: "KURZZEITPFLEGE",
        source: "TELEFON",
        startDate: new Date("2026-05-04T00:00:00Z"),
        endDate: new Date("2026-05-07T00:00:00Z"),
        guestName: "Dritte Person",
      }),
    ).rejects.toThrow(TRPCError);

    // Sanity: a non-overlapping range on the now-free-again original unit works.
    const nonOverlapping = await createBooking(db, {
      facilityId: facility.id,
      bookingType: "KURZZEITPFLEGE",
      source: "TELEFON",
      startDate: new Date("2026-06-01T00:00:00Z"),
      endDate: new Date("2026-06-05T00:00:00Z"),
      guestName: "Vierte Person",
    });
    expect([unit.id, otherUnit.id]).toContain(nonOverlapping.unitId);
  });
});
