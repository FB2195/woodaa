import type { BookingType, PrismaClient } from "@prisma/client";
import { sendSavedSearchMatchEmail } from "./email";

type MatchedFacility = { id: string; name: string; slug: string; city: string };

// Same fail-open Pflegegrad semantics as facility.list's nonCityWhere (see
// packages/api/src/routers/facility.ts) - both bounds null = "not
// specified", stays visible under any Pflegegrad filter - and the same
// "Ort oder PLZ" city match (name-contains OR postal-code-prefix). Kept as
// a small, direct Prisma query rather than reusing facility.list's full
// pool-plus-JS-filtering pipeline, which also handles pagination/sorting/
// facet counts this batch job has no use for.
export async function matchingFacilitiesForSavedSearch(
  db: PrismaClient,
  search: { city: string; bookingType: BookingType | null; pflegegrad: number | null },
): Promise<MatchedFacility[]> {
  return db.facility.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { city: { contains: search.city, mode: "insensitive" } },
        { postalCode: { startsWith: search.city } },
      ],
      ...(search.pflegegrad !== null
        ? {
            AND: [
              { OR: [{ minPflegegrad: null }, { minPflegegrad: { lte: search.pflegegrad } }] },
              { OR: [{ maxPflegegrad: null }, { maxPflegegrad: { gte: search.pflegegrad } }] },
            ],
          }
        : {}),
      ...(search.bookingType
        ? { capacities: { some: { bookingType: search.bookingType, availableSlots: { gt: 0 } } } }
        : {}),
    },
    select: { id: true, name: true, slug: true, city: true },
  });
}

// Scheduled hourly alongside the other apps/api/src/index.ts jobs. For each
// SavedSearch, only facilities that are NEW since the last check (not in
// lastMatchedFacilityIds) trigger an email - a facility that already
// matched last run doesn't get re-reported every hour, only once when it
// first appears (see the comment on SavedSearch in schema.prisma).
export async function checkSavedSearchAlerts(db: PrismaClient): Promise<void> {
  const searches = await db.savedSearch.findMany({ include: { user: true } });

  for (const search of searches) {
    const matches = await matchingFacilitiesForSavedSearch(db, search);
    const matchIds = matches.map((m) => m.id);
    const newFacilities = matches.filter((m) => !search.lastMatchedFacilityIds.includes(m.id));

    // Gated by the user's own notification preferences (see
    // notifySavedSearchEmail on User in schema.prisma) - opt-out-able,
    // unlike booking-related transactional mail.
    if (newFacilities.length > 0 && search.user.notifySavedSearchEmail) {
      try {
        await sendSavedSearchMatchEmail({
          to: search.user.email,
          recipientName: search.user.name,
          city: search.city,
          facilities: newFacilities,
        });
      } catch (err) {
        // Don't advance lastMatchedFacilityIds - these facilities stay
        // "new" and get retried on the next run instead of silently
        // getting marked as already-notified without an email going out.
        console.error(`Failed to send saved-search alert for ${search.id}:`, err);
        continue;
      }
    }

    await db.savedSearch.update({
      where: { id: search.id },
      data: { lastCheckedAt: new Date(), lastMatchedFacilityIds: matchIds },
    });
  }
}
