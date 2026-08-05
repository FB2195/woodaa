import { TRPCError } from "@trpc/server";
import type { FacilityWithCapacities } from "@woodaa/db";
import { AMENITY_OPTIONS, BookingType, FacilitySearchInput } from "@woodaa/validators";
import { z } from "zod";
import { geocodeSearchOrigin, reverseGeocode, searchLocations, type GeoPoint } from "../geocoding";
import { haversineDistanceKm } from "../geo";
import { withPhotoUrl } from "../r2";
import { publicProcedure, router } from "../trpc";

// Search-context-only: distance from the geocoded search origin, null when
// no origin could be resolved (no city searched, or geocoding failed) or
// the facility itself has no coordinates.
export type FacilityListItem = FacilityWithCapacities & {
  distanceKm: number | null;
  avgRating: number | null;
  reviewCount: number;
};

// Powers the search results toolbar's filter chips (Pflegeart + Ausstattung)
// with live counts, Booking.com-style - each count reflects every OTHER
// active filter except the chip's own dimension, computed against the same
// city/price/pflegegrad-filtered pool as the results themselves (see list
// below), not a separate query per chip.
export type FacilitySearchResult = {
  results: FacilityListItem[];
  totalCount: number;
  bookingTypeCounts: Record<BookingType, number>;
  amenityCounts: Record<string, number>;
};

function avgOf(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

// Narrower than FacilityWithCapacities on purpose - these run against the
// raw pool query result, before withPhotoUrl has mapped photos.key to
// photos.url, so they must not require the full (post-mapping) shape.
type FacetableFacility = { capacities: FacilityWithCapacities["capacities"]; amenities: string[] };

function matchesBookingType(facility: FacetableFacility, type: BookingType | undefined): boolean {
  if (!type) return true;
  return facility.capacities.some((c) => c.bookingType === type && c.availableSlots > 0);
}

function matchesAmenities(facility: FacetableFacility, amenities: string[] | undefined): boolean {
  if (!amenities || amenities.length === 0) return true;
  return amenities.every((a) => facility.amenities.includes(a));
}

// Derived from an already-fetched array, same "no second round-trip for
// aggregates" pattern as cheapestPrice - used by bySlug, which fetches the
// full approved-review list anyway for display.
function reviewStats(reviews: { rating: number }[]) {
  return { avgRating: avgOf(reviews.map((r) => r.rating)), reviewCount: reviews.length };
}

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
    .query(async ({ ctx, input }): Promise<FacilitySearchResult> => {
      // bookingType and amenities are deliberately NOT in this WHERE clause -
      // they're the two "faceted" dimensions the results toolbar shows as
      // chips with live counts, computed in JS below against this same
      // pool. city/maxPriceCents/pflegegrad are "hard" filters that always
      // apply to the pool itself (same as before this facet support existed).
      const pool = await ctx.db.facility.findMany({
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
          ...(input.maxPriceCents !== undefined
            ? { capacities: { some: { monthlyPriceCents: { lte: input.maxPriceCents } } } }
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
        // Cover photo only (not the whole gallery) - the list view just
        // needs a card thumbnail, bySlug below fetches the full gallery.
        include: {
          capacities: { include: { pflegegradPricing: true } },
          photos: { take: 1, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      });

      const poolFilteredByAmenities = pool.filter((f) => matchesAmenities(f, input.amenities));
      const poolFilteredByType = pool.filter((f) => matchesBookingType(f, input.bookingType));
      const bookingTypeCounts = Object.fromEntries(
        BookingType.options.map((type) => [
          type,
          poolFilteredByAmenities.filter((f) => matchesBookingType(f, type)).length,
        ]),
      ) as Record<BookingType, number>;
      const amenityCounts = Object.fromEntries(
        AMENITY_OPTIONS.map((amenity) => [
          amenity,
          poolFilteredByType.filter((f) => matchesAmenities(f, [amenity])).length,
        ]),
      );

      const facilities = pool.filter(
        (f) => matchesBookingType(f, input.bookingType) && matchesAmenities(f, input.amenities),
      );

      // Price and distance sorting can't be expressed in Prisma's orderBy
      // (price is a derived min over nested rows; distance needs a geocoded
      // origin + Haversine) - no PostGIS, so this happens in JS after fetch.
      // The unbounded findMany above is already today's behavior, no
      // pagination regression introduced here.
      let origin: GeoPoint | null = null;
      if (input.city && (input.radiusKm !== undefined || input.sort === "distance_asc")) {
        origin = await geocodeSearchOrigin(input.city);
      }

      // Batched (one query for the whole result page, not per-facility) -
      // same no-N+1 spirit as cheapestPrice. Only APPROVED reviews count
      // towards the badge.
      const ratingRows = facilities.length
        ? await ctx.db.review.groupBy({
            by: ["facilityId"],
            where: { facilityId: { in: facilities.map((f) => f.id) }, status: "APPROVED" },
            _avg: { rating: true },
            _count: { _all: true },
          })
        : [];
      const ratingByFacility = new Map(
        ratingRows.map((r) => [r.facilityId, { avgRating: r._avg.rating, reviewCount: r._count._all }]),
      );

      let results: FacilityListItem[] = facilities.map((f) => ({
        ...f,
        photos: f.photos.map(withPhotoUrl),
        distanceKm:
          origin && f.latitude !== null && f.longitude !== null
            ? haversineDistanceKm(origin, { latitude: f.latitude, longitude: f.longitude })
            : null,
        avgRating: ratingByFacility.get(f.id)?.avgRating ?? null,
        reviewCount: ratingByFacility.get(f.id)?.reviewCount ?? 0,
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

      return { results, totalCount: results.length, bookingTypeCounts, amenityCounts };
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const facility = await ctx.db.facility.findUnique({
        where: { slug: input.slug, status: "ACTIVE" },
        include: {
          capacities: { include: { pflegegradPricing: true } },
          photos: { orderBy: { createdAt: "asc" } },
          reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } },
        },
      });

      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
      }

      // Belegte Zeiträume für die date-basierten Kategorien, ohne
      // Gast-PII - nur zur Anzeige "diese Zeiträume sind schon belegt".
      const occupiedRangeRows = await ctx.db.booking.findMany({
        where: { facilityId: facility.id, status: "BESTAETIGT", startDate: { not: null } },
        select: { bookingType: true, startDate: true, endDate: true },
        orderBy: { startDate: "asc" },
      });
      const occupiedRanges = occupiedRangeRows.map((r) => ({
        bookingType: r.bookingType,
        startDate: r.startDate!,
        endDate: r.endDate!,
      }));

      return {
        ...facility,
        photos: facility.photos.map(withPhotoUrl),
        occupiedRanges,
        ...reviewStats(facility.reviews),
      };
    }),

  searchLocations: publicProcedure
    .input(z.object({ query: z.string().trim().min(2) }))
    .query(async ({ input }) => searchLocations(input.query)),

  // Backs the "In deiner Nähe suchen" geolocation shortcut - browser gives
  // us coordinates, we turn that into a city name the existing city-based
  // search already knows how to handle.
  reverseGeocode: publicProcedure
    .input(z.object({ latitude: z.number(), longitude: z.number() }))
    .query(async ({ input }) => ({
      city: await reverseGeocode(input.latitude, input.longitude),
    })),
});
