import {
  Prisma,
  type BookingAdminApprovalStatus,
  type BookingFacilityApprovalStatus,
  type PaymentStatus,
  type PrismaClient,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { paymentMethodsRequiringStripe, type BookingType, type PaymentMethod } from "@woodaa/validators";
import { stripeClient } from "./stripe";

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
  // end without a start is never sensible; start without an end is "Ende
  // offen" (open-ended, e.g. ongoing Tages-/Nachtpflege) and is allowed -
  // freeUnitCandidates' conflict query and the DB's GIST exclusion
  // constraint both already treat a null upper bound as unbounded going
  // forward, so no further special-casing is needed downstream.
  if (start === null && end !== null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Ohne Startdatum kann kein Enddatum gesetzt werden.",
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

// Read-only version of the conflict check createBooking uses to claim a
// unit - same query, just answering "is there room" instead of also
// reserving it. Used by search (facility.list) to check a requested
// KURZZEITPFLEGE date range without side effects, so no transaction/
// savepoint machinery is needed here.
export async function hasFreeUnitForRange(
  db: PrismaClient | Tx,
  facilityId: string,
  bookingType: BookingType,
  startDate: Date,
  endDate: Date,
): Promise<boolean> {
  const candidates = await freeUnitCandidates(db as Tx, facilityId, bookingType, startDate, endDate);
  return candidates.length > 0;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Scans forward day-by-day for the earliest date a KURZZEITPFLEGE stay of
// the given length could start - a plain linear scan rather than an
// interval-gap query, since the lookahead window is small (a couple of
// months) and this only runs for facilities search already found to be
// fully booked for the originally requested range.
export async function findNextAvailableRangeStart(
  db: PrismaClient | Tx,
  facilityId: string,
  bookingType: BookingType,
  durationDays: number,
  searchFrom: Date,
  lookaheadDays = 60,
): Promise<Date | null> {
  const from = startOfDay(searchFrom);
  for (let offset = 0; offset <= lookaheadDays; offset++) {
    const start = addDays(from, offset);
    const end = addDays(start, durationDays - 1);
    if (await hasFreeUnitForRange(db, facilityId, bookingType, start, end)) {
      return start;
    }
  }
  return null;
}

const ISO_WEEKDAY_OF = (date: Date): number => {
  const jsDay = date.getUTCDay(); // 0 = Sonntag ... 6 = Samstag
  return jsDay === 0 ? 7 : jsDay; // -> 1 = Montag ... 7 = Sonntag
};

// TAGESPFLEGE/NACHTPFLEGE bookings are single-day (see the Booking model
// comment) - there's no recurring-reservation record to check against yet,
// so "available for this weekly pattern" is answered by looking at the
// NEXT upcoming occurrence of each requested weekday and checking whether
// a unit is free that specific day. This is a real, honest signal ("could
// you start this pattern soon") without requiring the bigger feature of
// actually booking a recurring series, which doesn't exist yet.
export async function computeWeekdayAvailability(
  db: PrismaClient | Tx,
  facilityId: string,
  bookingType: BookingType,
  weekdays: number[],
  searchFrom: Date,
  lookaheadWeeks = 8,
): Promise<{ available: boolean; nextFullyAvailableDate: Date | null }> {
  if (weekdays.length === 0) return { available: true, nextFullyAvailableDate: null };

  const from = startOfDay(searchFrom);
  let allAvailable = true;
  let latestNeeded: Date | null = null;

  for (const weekday of weekdays) {
    let found: Date | null = null;
    for (let offset = 0; offset <= lookaheadWeeks * 7; offset++) {
      const candidate = addDays(from, offset);
      if (ISO_WEEKDAY_OF(candidate) !== weekday) continue;
      const { availableUnits } = await computeAvailability(db, facilityId, bookingType, candidate);
      if (availableUnits > 0) {
        found = candidate;
        break;
      }
    }
    if (!found) {
      allAvailable = false;
      continue;
    }
    if (!latestNeeded || found > latestNeeded) latestNeeded = found;
  }

  return {
    available: allAvailable,
    nextFullyAvailableDate: allAvailable ? null : latestNeeded,
  };
}

export type CreateBookingInput = {
  facilityId: string;
  bookingType: BookingType;
  source: "ONLINE" | "TELEFON" | "VOR_ORT";
  startDate?: Date | null;
  endDate?: Date | null;
  desiredStartDate?: Date | null;
  // TAGESPFLEGE/NACHTPFLEGE only - see Booking.hoursPerDay.
  hoursPerDay?: number | null;
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestFirstName?: string | null;
  guestLastName?: string | null;
  guestBirthDate?: Date | null;
  guestStreet?: string | null;
  guestPostalCode?: string | null;
  guestCity?: string | null;
  krankenkasse?: string | null;
  versicherungsnummerEncrypted?: string | null;
  pflegegrad?: number | null;
  pflegegradAntragLaeuft?: boolean;
  note?: string | null;
  // ONLINE bookings only - see PaymentMethod/PaymentStatus in schema.prisma.
  paymentMethod?: PaymentMethod | null;
  paymentStatus?: PaymentStatus | null;
  stripePaymentIntentId?: string | null;
  // Set when the booking user is a bevollmächtigt account - see
  // BookingAdminApprovalStatus in schema.prisma. Defaults to
  // NICHT_ERFORDERLICH (the Prisma schema default) when omitted.
  adminApprovalStatus?: BookingAdminApprovalStatus;
  // Set from the facility's bookingApprovalMode at booking time - see
  // BookingFacilityApprovalStatus in schema.prisma. Defaults to
  // NICHT_ERFORDERLICH (the Prisma schema default) when omitted.
  facilityApprovalStatus?: BookingFacilityApprovalStatus;
};

// Atomically claims one free unit and books it. Auto-assigns the unit -
// callers never choose which physical place, matching the "one click, no
// setup" requirement for phone/walk-in bookings just as much as the public
// instant-booking flow.
export async function createBooking(db: PrismaClient, input: CreateBookingInput) {
  const { startDate, endDate } = normalizeRange(input.startDate, input.endDate);

  // A facility may require a minimum number of nights for Kurzzeitpflege
  // (see FacilityCapacity.minStayNights). Checked here (not just
  // client-side in BookingForm.tsx) so it also covers
  // operator.createManualBooking, and so a direct API call can't bypass it.
  // Only checked when both dates are given - a manual phone/walk-in
  // Kurzzeitpflege booking with an open end date (staff doesn't know the
  // discharge date yet) has nothing to check against and stays allowed, as
  // before.
  if (input.bookingType === "KURZZEITPFLEGE" && startDate && endDate) {
    const capacity = await db.facilityCapacity.findUnique({
      where: {
        facilityId_bookingType: { facilityId: input.facilityId, bookingType: "KURZZEITPFLEGE" },
      },
      select: { minStayNights: true },
    });
    const nights = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    if (capacity?.minStayNights && nights < capacity.minStayNights) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Diese Einrichtung erfordert bei Kurzzeitpflege einen Mindestaufenthalt von ${capacity.minStayNights} Nächten.`,
      });
    }
  }

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
            desiredStartDate: input.desiredStartDate ?? null,
            hoursPerDay: input.hoursPerDay ?? null,
            userId: input.userId ?? null,
            guestName: input.guestName ?? null,
            guestEmail: input.guestEmail ?? null,
            guestPhone: input.guestPhone ?? null,
            guestFirstName: input.guestFirstName ?? null,
            guestLastName: input.guestLastName ?? null,
            guestBirthDate: input.guestBirthDate ?? null,
            guestStreet: input.guestStreet ?? null,
            guestPostalCode: input.guestPostalCode ?? null,
            guestCity: input.guestCity ?? null,
            krankenkasse: input.krankenkasse ?? null,
            versicherungsnummerEncrypted: input.versicherungsnummerEncrypted ?? null,
            pflegegrad: input.pflegegrad ?? null,
            pflegegradAntragLaeuft: input.pflegegradAntragLaeuft ?? false,
            note: input.note ?? null,
            paymentMethod: input.paymentMethod ?? null,
            paymentStatus: input.paymentStatus ?? null,
            stripePaymentIntentId: input.stripePaymentIntentId ?? null,
            ...(input.adminApprovalStatus
              ? { adminApprovalStatus: input.adminApprovalStatus }
              : {}),
            ...(input.facilityApprovalStatus
              ? { facilityApprovalStatus: input.facilityApprovalStatus }
              : {}),
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
  options?: { requireFacilityId?: string; requireGuestEmail?: string; requireUserId?: string },
) {
  // Tracks whether this call is the one that actually flipped the booking
  // to STORNIERT (as opposed to it already being STORNIERT beforehand) -
  // used below to only attempt the Stripe cancel on a real transition.
  let justCancelled = false;

  const updated = await db.$transaction(async (tx) => {
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
    if (options?.requireUserId && booking.userId !== options.requireUserId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Buchung nicht gefunden." });
    }
    if (booking.status === "STORNIERT") return booking;

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "STORNIERT", cancelledAt: new Date() },
    });
    await syncCapacityCache(tx, booking.facilityId, booking.bookingType);
    justCancelled = true;
    return updated;
  });

  // Payment still in flight (not yet captured) on a Karte/Klarna/PayPal
  // booking - cancel the PaymentIntent so a payment_intent.succeeded
  // webhook that arrives after this point can't flip paymentStatus to
  // BEZAHLT for a booking whose unit has already been released (see
  // webhooks.ts, which refunds as a fallback if this race is lost anyway).
  // Done after the transaction, not inside it, so this network call
  // doesn't hold the DB transaction open. Stripe rejects cancelling a
  // PaymentIntent that's already in a terminal state (e.g. it succeeded
  // moments ago) - tolerated, not fatal, the booking is cancelled either way.
  if (
    justCancelled &&
    updated.paymentMethod &&
    paymentMethodsRequiringStripe.includes(updated.paymentMethod as PaymentMethod) &&
    updated.stripePaymentIntentId &&
    updated.paymentStatus !== "BEZAHLT"
  ) {
    try {
      await stripeClient().paymentIntents.cancel(updated.stripePaymentIntentId);
    } catch (err) {
      console.error("Failed to cancel Stripe PaymentIntent on booking cancel", err);
    }
  }

  return updated;
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
