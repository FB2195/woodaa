import { Prisma, PrismaClient } from "@prisma/client";

export type { FacilityCapacity, KurzzeitpflegeBooking } from "@prisma/client";

/**
 * Payload types for Server Component consumers, which call the tRPC router
 * directly via `createCaller` (no HTTP round-trip, so no JSON
 * serialization) and therefore receive real `Date` objects — unlike
 * `inferRouterOutputs`, which reflects the serialized (Date -> string)
 * shape used by the client-side tRPC React Query link.
 */
export type FacilityWithCapacities = Prisma.FacilityGetPayload<{
  include: { capacities: true };
}>;
export type FacilityWithDetails = Prisma.FacilityGetPayload<{
  include: { capacities: true; kurzzeitpflegeBookings: true };
}>;

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
