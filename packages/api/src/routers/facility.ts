import { TRPCError } from "@trpc/server";
import type { FacilityWithCapacities } from "@woodaa/db";
import { FacilitySearchInput } from "@woodaa/validators";
import { z } from "zod";
import { geocodeSearchOrigin, searchLocations, type GeoPoint } from "../geocoding";
import { haversineDistanceKm } from "../geo";
import { publicProcedure, router } from "../trpc";

// Search-context-only: distance from the geocoded search origin, null when
// no origin could be resolved (no city searched, or geocoding failed) or
// the facility itself has no coordinates.
export type FacilityListItem = FacilityWithCapacities & {
  distanceKm: number | null;
};

function cheapestPrice(
  facility: FacilityWithCapacities,
  bookingType: FacilityWithCapacities["capacities"][number]["bookingType"] | undefined,
): number | null {
  const relevant = bookingType
    ? facility.capacities.filter((c) => c.bookingType === bookingType)
    : facility.capacities;
  const priced = relevant
    .map((c) => c.monthlyPriceCents)
    .filter((p): p is number => p !== null);
  return priced.length ? Math.min(...priced) : null;
}

export const facilityRouter = router({
  list: publicProcedure
    .input(FacilitySearchInput)
    .query(async ({ ctx, input }): Promise<FacilityListItem[]> => {
      const facilities = await ctx.db.facility.findMany({
        where: {
          status: "ACTIVE",
          // "city" is really "Ort oder PLZ" from the user's perspective - a
          // postal-code search like "10555" previously matched nothing at
          // all since only the city name was checked.
          ...(input.city
            ? {
                OR: [
                  { city: { contains: input.city, mode: "insensitive" } },
                  { postalCode: { startsWith: input.city } },
                ],
              }
            : {}),
          // bookingType and maxPriceCents must be checked against the SAME
          // capacity row (a single `some`), not two independent ones -
          // otherwise a facility could match via different capacities for
          // type-availability and for price.
          ...(input.bookingType || input.maxPriceCents !== undefined
            ? {
                capacities: {
                  some: {
                    ...(input.bookingType
                      ? { bookingType: input.bookingType, availableSlots: { gt: 0 } }
                      : {}),
                    ...(input.maxPriceCents !== undefined
                      ? { monthlyPriceCents: { lte: input.maxPriceCents } }
                      : {}),
                  },
                },
              }
            : {}),
          // Both minPflegegrad/maxPflegegrad null = "not specified" - stays
          // visible under any Pflegegrad filter (fail-open).
          ...(input.pflegegrad !== undefined
            ? {
                AND: [
                  { OR: [{ minPflegegrad: null }, { minPflegegrad: { lte: input.pflegegrad } }] },
                  { OR: [{ maxPflegegrad: null }, { maxPflegegrad: { gte: input.pflegegrad } }] },
                ],
              }
            : {}),
        },
        include: { capacities: true },
        orderBy: { createdAt: "desc" },
      });

      // Price and distance sorting can't be expressed in Prisma's orderBy
      // (price is a derived min over nested rows; distance needs a geocoded
      // origin + Haversine) - no PostGIS, so this happens in JS after fetch.
      // The unbounded findMany above is already today's behavior, no
      // pagination regression introduced here.
      let origin: GeoPoint | null = null;
      if (input.city && (input.radiusKm !== undefined || input.sort === "distance_asc")) {
        origin = await geocodeSearchOrigin(input.city);
      }

      let results: FacilityListItem[] = facilities.map((f) => ({
        ...f,
        distanceKm:
          origin && f.latitude !== null && f.longitude !== null
            ? haversineDistanceKm(origin, { latitude: f.latitude, longitude: f.longitude })
            : null,
      }));

      if (input.radiusKm !== undefined && origin) {
        results = results.filter(
          (f) => f.distanceKm !== null && f.distanceKm <= input.radiusKm!,
        );
      }

      if (input.sort === "price_asc") {
        results.sort((a, b) => {
          const pa = cheapestPrice(a, input.bookingType);
          const pb = cheapestPrice(b, input.bookingType);
          if (pa === null && pb === null) return 0;
          if (pa === null) return 1;
          if (pb === null) return -1;
          return pa - pb;
        });
      } else if (input.sort === "distance_asc" && origin) {
        results.sort((a, b) => {
          if (a.distanceKm === null && b.distanceKm === null) return 0;
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
      }
      // "newest" (default, or distance_asc requested without a resolvable
      // origin) falls through to the createdAt-desc order Prisma already
      // applied. Array.prototype.sort is stable in V8, so price/distance
      // ties keep their newest-first relative order for free.

      return results;
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const facility = await ctx.db.facility.findUnique({
        where: { slug: input.slug, status: "ACTIVE" },
        include: {
          capacities: true,
          kurzzeitpflegeBookings: { orderBy: { startDate: "asc" } },
        },
      });

      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
      }

      return facility;
    }),

  searchLocations: publicProcedure
    .input(z.object({ query: z.string().trim().min(2) }))
    .query(async ({ input }) => searchLocations(input.query)),
});
