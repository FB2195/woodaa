import { TRPCError } from "@trpc/server";
import type { FacilityWithCapacities } from "@woodaa/db";
import { AMENITY_OPTIONS, BookingType, FacilitySearchInput } from "@woodaa/validators";
import { z } from "zod";
import { geocodeSearchOrigin, reverseGeocode, searchLocations, type GeoPoint } from "../geocoding";
import { haversineDistanceKm } from "../geo";
import { getNearbyPlaces } from "../nearbyPlaces";
import { monthlyEquivalentCents } from "../pricing";
import { withPhotoUrl } from "../r2";
import { checkRequestedAvailability } from "../searchAvailability";
import { publicProcedure, router } from "../trpc";

// Search-context-only: distance from the geocoded search origin, null when
// no origin could be resolved (no city searched, or geocoding failed) or
// the facility itself has no coordinates. isAvailableForRequest/
// availabilityNote are null unless bookingType plus a matching date/time
// filter were given (see checkRequestedAvailability) - a plain search
// without any of that never touches the availability engine. displayPriceCents
// is the "ab X €/Monat" figure the card should show - the Pflegegrad-specific
// rate when a Pflegegrad filter was given and the facility has entered one,
// otherwise the same generic cheapest-capacity price as before (see
// facilityDisplayPriceCents).
export type FacilityListItem = FacilityWithCapacities & {
  distanceKm: number | null;
  avgRating: number | null;
  reviewCount: number;
  isAvailableForRequest: boolean | null;
  availabilityNote: string | null;
  displayPriceCents: number | null;
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

// onlyAvailable defaults to true, matching this app's original behavior
// (a bookingType filter always meant "with free capacity") - the "Nur
// freie Pflegeplätze anzeigen" toggle sets it false to also surface
// fully-booked facilities, which the router then flags via
// checkRequestedAvailability instead of hiding.
function matchesBookingType(
  facility: FacetableFacility,
  type: BookingType | undefined,
  onlyAvailable = true,
): boolean {
  if (!type) return true;
  return facility.capacities.some(
    (c) => c.bookingType === type && (!onlyAvailable || c.availableSlots > 0),
  );
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

// The card's "ab X €/Monat" figure. When a Pflegegrad filter is set, prefers
// the real rate that Pflegegrad actually pays (live computation against
// CapacityPflegegradPricing, same formula as the auto-derived
// FacilityCapacity.monthlyPriceCents - see monthlyEquivalentCents) - falls
// back to the generic cheapest-capacity price when the facility hasn't
// entered a rate for that specific Pflegegrad yet, so the line never just
// disappears.
function facilityDisplayPriceCents(
  facility: { capacities: FacilityWithCapacities["capacities"] },
  bookingType: BookingType | undefined,
  pflegegrad: number | undefined,
): number | null {
  const relevant = bookingType
    ? facility.capacities.filter((c) => c.bookingType === bookingType)
    : facility.capacities;

  if (pflegegrad !== undefined) {
    const forPflegegrad = relevant
      .map((c) =>
        monthlyEquivalentCents(
          c.bookingType,
          c.pflegegradPricing.find((r) => r.pflegegrad === pflegegrad),
        ),
      )
      .filter((p): p is number => p !== null);
    if (forPflegegrad.length) return Math.min(...forPflegegrad);
  }

  return cheapestPrice(facility, bookingType);
}

function cheapestPrice(
  facility: { capacities: FacilityWithCapacities["capacities"] },
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

      const onlyAvailable = input.onlyAvailable !== false;
      const facilities = pool.filter(
        (f) =>
          matchesBookingType(f, input.bookingType, onlyAvailable) &&
          matchesAmenities(f, input.amenities),
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

      // Skips straight past the availability engine (hasFreeSlotNow=true
      // short-circuits) for every facility that already has capacity right
      // now - the day-by-day lookahead scans only run for facilities the
      // "Nur freie Pflegeplätze anzeigen" toggle let through despite being
      // sold out, or that don't match the exact requested date/range/
      // weekdays. Parallelized since this dataset is small (a search
      // results page, not the whole catalog).
      const annotations = await Promise.all(
        facilities.map((f) => {
          const capacity = f.capacities.find((c) => c.bookingType === input.bookingType);
          return checkRequestedAvailability(
            ctx.db,
            f.id,
            input.bookingType,
            input,
            (capacity?.availableSlots ?? 0) > 0,
            capacity?.availableFrom ?? null,
          );
        }),
      );

      let results: FacilityListItem[] = facilities.map((f, i) => ({
        ...f,
        photos: f.photos.map(withPhotoUrl),
        distanceKm:
          origin && f.latitude !== null && f.longitude !== null
            ? haversineDistanceKm(origin, { latitude: f.latitude, longitude: f.longitude })
            : null,
        avgRating: ratingByFacility.get(f.id)?.avgRating ?? null,
        reviewCount: ratingByFacility.get(f.id)?.reviewCount ?? 0,
        isAvailableForRequest: annotations[i]!.isAvailableForRequest,
        availabilityNote: annotations[i]!.availabilityNote,
        displayPriceCents: facilityDisplayPriceCents(f, input.bookingType, input.pflegegrad),
      }));

      if (input.radiusKm !== undefined && origin) {
        results = results.filter(
          (f) => f.distanceKm !== null && f.distanceKm <= input.radiusKm!,
        );
      }

      if (input.sort === "price_asc") {
        // Sorts by the same figure the card actually shows (displayPriceCents
        // - Pflegegrad-specific when that filter is set) rather than always
        // the generic cheapest price, so the order matches what's on screen.
        results.sort((a, b) => {
          const pa = a.displayPriceCents;
          const pb = b.displayPriceCents;
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
      } else if (input.sort === "availability_first") {
        // isAvailableForRequest is null when no date/time filter was given
        // (or onlyAvailable already excluded the fully-booked ones) - treat
        // that the same as "available" so this sort is a no-op rather than
        // scrambling order when there's nothing to distinguish by.
        results.sort((a, b) => {
          const aFree = a.isAvailableForRequest ?? true;
          const bFree = b.isAvailableForRequest ?? true;
          return aFree === bFree ? 0 : aFree ? -1 : 1;
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

      return {
        ...facility,
        photos: facility.photos.map(withPhotoUrl),
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

  // "Umgebung der Unterkunft" section on the facility detail page -
  // shopping/healthcare/transport points of interest near the facility.
  nearbyPlaces: publicProcedure
    .input(z.object({ latitude: z.number(), longitude: z.number() }))
    .query(async ({ input }) => getNearbyPlaces(input.latitude, input.longitude)),
});
