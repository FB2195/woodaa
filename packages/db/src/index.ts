import { Prisma, PrismaClient } from "@prisma/client";
import type { FacilityPhoto as PrismaFacilityPhoto } from "@prisma/client";

export type { FacilityCapacity, KurzzeitpflegeBooking, Review } from "@prisma/client";

// R2 stores only the object `key` (see the FacilityPhoto model comment in
// schema.prisma) - every router enriches each row with a derived absolute
// `url` (packages/api/src/r2.ts withPhotoUrl) before returning it, so this
// exported type describes what consumers actually receive, not the raw
// table row shape.
export type FacilityPhoto = PrismaFacilityPhoto & { url: string };

/**
 * Payload types for Server Component consumers, which call the tRPC router
 * directly via `createCaller` (no HTTP round-trip, so no JSON
 * serialization) and therefore receive real `Date` objects — unlike
 * `inferRouterOutputs`, which reflects the serialized (Date -> string)
 * shape used by the client-side tRPC React Query link.
 */
type FacilityWithCapacitiesRaw = Prisma.FacilityGetPayload<{
  include: { capacities: true; photos: true };
}>;
export type FacilityWithCapacities = Omit<
  FacilityWithCapacitiesRaw,
  "photos"
> & { photos: FacilityPhoto[] };

type FacilityWithDetailsRaw = Prisma.FacilityGetPayload<{
  include: {
    capacities: true;
    kurzzeitpflegeBookings: true;
    photos: true;
    reviews: true;
  };
}>;
export type FacilityWithDetails = Omit<FacilityWithDetailsRaw, "photos"> & {
  photos: FacilityPhoto[];
};

/**
 * Single shared Prisma client instance, reused across apps/api and any
 * scripts. Avoids exhausting Postgres connections via repeated
 * `new PrismaClient()` calls during development hot-reload.
 */
declare global {
  var __woodaaPrisma: PrismaClient | undefined;
}

export const db = globalThis.__woodaaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__woodaaPrisma = db;
}
