import { Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { BookingType } from "@woodaa/validators";

type Tx = Prisma.TransactionClient;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// A unit counts as occupied on `date` if it has an active (BESTAETIGT)
// booking whose range covers that date. STATIONAERE_AUFNAHME bookings have
// startDate/endDate = null, which this condition treats as "covers every
// date" - the persistent "occupied until cancelled" semantics, with no
// separate code path from the date-ranged categories.
async function occupiedUnitIds(
  db: PrismaClient | Tx,
  facilityId: string,
  bookingType: BookingType,
  date: Date,
): Promise<Set<string>> {
  const d = startOfDay(date);
  const bookings = await db.booking.findMany({
    where: {
      facilityId,
      bookingType,
      status: "BESTAETIGT",
      OR: [
        { startDate: null },
        { AND: [{ startDate: { lte: d } }, { endDate: { gte: d } }] },
      ],
    },
    select: { unitId: true },
  });
  return new Set(bookings.map((b) => b.unitId));
}

export async function computeAvailability(
  db: PrismaClient | Tx,
  facilityId: string,
  bookingType: BookingType,
  date: Date = new Date(),
): Promise<{ totalUnits: number; availableUnits: number }> {
  const units = await db.facilityUnit.findMany({
    where: { facilityId, bookingType },
    select: { id: true },
  });
  const occupied = await occupiedUnitIds(db, facilityId, bookingType, date);
  return {
    totalUnits: units.length,
    availableUnits: units.filter((u) => !occupied.has(u.id)).length,
  };
}

// Sole writer of FacilityCapacity.totalSlots/availableSlots. Called inside
// the same transaction as every unit/booking mutation so the cache can
// never be observed out of sync with the FacilityUnit/Booking rows it's
// derived from - see the field comments in schema.prisma.
export async function syncCapacityCache(
  tx: Tx,
  facilityId: string,
  bookingType: BookingType,
): Promise<void> {
  const { totalUnits, availableUnits } = await computeAvailability(tx, facilityId, bookingType);
  await tx.facilityCapacity.upsert({
    where: { facilityId_bookingType: { facilityId, bookingType } },
    create: { facilityId, bookingType, totalSlots: totalUnits, availableSlots: availableUnits },
    update: { totalSlots: totalUnits, availableSlots: availableUnits },
  });
}

// Recomputes every facility/category cache - covers the "today crossed
// midnight" case for date-ranged categories, where a booking's window can
// start or end without any write happening at that moment. Wired up as an
// hourly interval in apps/api (see index.ts); safe to call anytime, from
// anywhere, as often as needed - it's a pure re-derivation, not a delta.
export async function recomputeAllCapacityCaches(db: PrismaClient): Promise<void> {
  const groups = await db.facilityUnit.findMany({
    select: { facilityId: true, bookingType: true },
    distinct: ["facilityId", "bookingType"],
  });
  for (const { facilityId, bookingType } of groups) {
    await db.$transaction((tx) => syncCapacityCache(tx, facilityId, bookingType));
  }
}

// Postgres exclusion_violation = SQLSTATE 23P01. Prisma has no named error
// code for this (unlike unique violations -> P2002), so this string-matches
// the wrapped raw error - the only reliable signal available short of
// dropping to $queryRaw for the insert itself. Duck-typed rather than
// `instanceof Prisma.PrismaClientKnownRequestError`: packages/api and
// @woodaa/db can end up with distinct resolved copies of @prisma/client in
// a pnpm workspace, which breaks class-identity checks (see the same note
// in routers/review.ts).
function isExclusionViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string" &&
    (err as { message: string }).message.includes("23P01")
  );
}

function normalizeRange(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
): { startDate: Date | null; endDate: Date | null } {
  const start = startDate ? startOfDay(startDate) : null;
  const end = endDate ? startOfDay(endDate) : null;
  if ((start === null) !== (end === null)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Start- und Enddatum müssen beide gesetzt sein oder beide leer bleiben.",
    });
  }
  if (start && end && end < start) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Enddatum darf nicht vor dem Startdatum liegen.",
    });
  }
  return { startDate: start, endDate: end };
}

// Units that, based on the current data, look free for the requested range
// - a fast pre-filter, not the source of correctness. The actual guarantee
// against double-booking is the DB exclusion constraint (see migration
// 20260804120000_availability_engine); createBooking below still attempts
// each candidate transactionally and falls through to the next one if a
// concurrent writer won the race in the meantime.
async function freeUnitCandidates(
  tx: Tx,
  facilityId: string,
  bookingType: BookingType,
  startDate: Date | null,
  endDate: Date | null,
): Promise<string[]> {
  const units = await tx.facilityUnit.findMany({
    where: { facilityId, bookingType },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (units.length === 0) return [];

  const conflicting = await tx.booking.findMany({
    where: {
      facilityId,
      bookingType,
      status: "BESTAETIGT",
      unitId: { in: units.map((u) => u.id) },
      OR: [
        { startDate: null }, // persistent booking blocks its unit entirely
        {
          AND: [
            startDate ? { OR: [{ endDate: null }, { endDate: { gte: startDate } }] } : {},
            endDate ? { OR: [{ startDate: null }, { startDate: { lte: endDate } }] } : {},
          ],
        },
      ],
    },
    select: { unitId: true },
  });
  const busy = new Set(conflicting.map((c) => c.unitId));
  return units.map((u) => u.id).filter((id) => !busy.has(id));
}

export type CreateBookingInput = {
  facilityId: string;
  bookingType: BookingType;
  source: "ONLINE" | "TELEFON" | "VOR_ORT";
  startDate?: Date | null;
  endDate?: Date | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  note?: string | null;
};

// Atomically claims one free unit and books it. Auto-assigns the unit -
// callers never choose which physical place, matching the "one click, no
// setup" requirement for phone/walk-in bookings just as much as the public
// instant-booking flow.
export async function createBooking(db: PrismaClient, input: CreateBookingInput) {
  const { startDate, endDate } = normalizeRange(input.startDate, input.endDate);

  return db.$transaction(async (tx) => {
    const candidates = await freeUnitCandidates(
      tx,
      input.facilityId,
      input.bookingType,
      startDate,
      endDate,
    );
    if (candidates.length === 0) {
      const total = await tx.facilityUnit.count({
        where: { facilityId: input.facilityId, bookingType: input.bookingType },
      });
      throw new TRPCError({
        code: total === 0 ? "BAD_REQUEST" : "CONFLICT",
        message:
          total === 0
            ? "Für diese Kategorie sind keine Plätze eingerichtet."
            : "Für den gewünschten Zeitraum ist aktuell kein Platz mehr frei.",
      });
    }

    for (const unitId of candidates) {
      // SAVEPOINT isolates each attempt: a failed INSERT aborts the rest of
      // the surrounding transaction in Postgres unless rolled back to a
      // savepoint first, so without this the second candidate's attempt
      // would fail with "transaction aborted" instead of a fresh try.
      await tx.$executeRaw`SAVEPOINT claim_attempt`;
      try {
        const booking = await tx.booking.create({
          data: {
            facilityId: input.facilityId,
            unitId,
            bookingType: input.bookingType,
            source: input.source,
            startDate,
            endDate,
            guestName: input.guestName ?? null,
            guestEmail: input.guestEmail ?? null,
            guestPhone: input.guestPhone ?? null,
            note: input.note ?? null,
          },
        });
        await tx.$executeRaw`RELEASE SAVEPOINT claim_attempt`;
        await syncCapacityCache(tx, input.facilityId, input.bookingType);
        return booking;
      } catch (err) {
        await tx.$executeRaw`ROLLBACK TO SAVEPOINT claim_attempt`;
        if (!isExclusionViolation(err)) throw err;
        // Someone else claimed this exact unit/range in the meantime - try
        // the next candidate.
      }
    }

    throw new TRPCError({
      code: "CONFLICT",
      message: "Für den gewünschten Zeitraum ist aktuell kein Platz mehr frei.",
    });
  });
}

export async function cancelBooking(
  db: PrismaClient,
  bookingId: string,
  options?: { requireFacilityId?: string; requireGuestEmail?: string },
) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Buchung nicht gefunden." });
    }
    if (options?.requireFacilityId && booking.facilityId !== options.requireFacilityId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Buchung nicht gefunden." });
    }
    if (
      options?.requireGuestEmail &&
      booking.guestEmail?.toLowerCase() !== options.requireGuestEmail.trim().toLowerCase()
    ) {
      throw new TRPCError({ code: "FORBIDDEN", message: "E-Mail-Adresse stimmt nicht überein." });
    }
    if (booking.status === "STORNIERT") return booking;

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "STORNIERT", cancelledAt: new Date() },
    });
    await syncCapacityCache(tx, booking.facilityId, booking.bookingType);
    return updated;
  });
}

// Provisions/deprovisions anonymous units to match `desiredTotal`. Removing
// units only ever deletes ones with zero active bookings (past, present, or
// future) - deleting a unit cascades onto its Booking rows, so one with a
// live reservation must never be picked, even if it looks free "today".
export async function setUnitCount(
  tx: Tx,
  facilityId: string,
  bookingType: BookingType,
  desiredTotal: number,
): Promise<void> {
  const units = await tx.facilityUnit.findMany({
    where: { facilityId, bookingType },
    include: { bookings: { where: { status: "BESTAETIGT" }, select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (desiredTotal > units.length) {
    const toCreate = desiredTotal - units.length;
    // Continue numbering past the highest existing "Platz N" label instead
    // of restarting at 1, so labels stay unique even after earlier removals.
    const existingNumbers = units
      .map((u) => /^Platz (\d+)$/.exec(u.label)?.[1])
      .filter((n): n is string => !!n)
      .map(Number);
    let next = (existingNumbers.length ? Math.max(...existingNumbers) : 0) + 1;
    await tx.facilityUnit.createMany({
      data: Array.from({ length: toCreate }, () => ({
        facilityId,
        bookingType,
        label: `Platz ${next++}`,
      })),
    });
  } else if (desiredTotal < units.length) {
    const toRemove = units.length - desiredTotal;
    const removable = units.filter((u) => u.bookings.length === 0);
    if (removable.length < toRemove) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Nur ${removable.length} freie Plätze ohne aktive Buchung können entfernt werden. Storniere zuerst weitere Buchungen, um weiter zu reduzieren.`,
      });
    }
    const idsToRemove = removable.slice(0, toRemove).map((u) => u.id);
    await tx.facilityUnit.deleteMany({ where: { id: { in: idsToRemove } } });
  }

  await syncCapacityCache(tx, facilityId, bookingType);
}
