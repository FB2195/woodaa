import { Prisma, PrismaClient } from "@prisma/client";
import type { FacilityPhoto as PrismaFacilityPhoto } from "@prisma/client";

export type {
  CapacityPflegegradPricing,
  FacilityUnit,
  PhotoCategory,
  Review,
  SupportRequest,
} from "@prisma/client";
export type { Booking as UnitBooking } from "@prisma/client";

// FacilityCapacity now always carries its per-Pflegegrad pricing rows
// alongside it (see CapacityPflegegradPricing in schema.prisma) - every
// consumer needs both together, so this re-exported name is the payload
// shape, not the bare Prisma model.
export type FacilityCapacity = Prisma.FacilityCapacityGetPayload<{
  include: { pflegegradPricing: true };
}>;

// R2 stores only the object `key` (see the FacilityPhoto model comment in
// schema.prisma) - every router enriches each row with a derived absolute
// `url` (packages/api/src/r2.ts withPhotoUrl) before returning it, so this
// exported type describes what consumers actually receive, not the raw
// table row shape.
export type FacilityPhoto = PrismaFacilityPhoto & { url: string | null };

/**
 * Payload types for Server Component consumers, which call the tRPC router
 * directly via `createCaller` (no HTTP round-trip, so no JSON
 * serialization) and therefore receive real `Date` objects — unlike
 * `inferRouterOutputs`, which reflects the serialized (Date -> string)
 * shape used by the client-side tRPC React Query link.
 */
type FacilityWithCapacitiesRaw = Prisma.FacilityGetPayload<{
  include: { capacities: { include: { pflegegradPricing: true } }; photos: true };
}>;
export type FacilityWithCapacities = Omit<
  FacilityWithCapacitiesRaw,
  "photos"
> & { photos: FacilityPhoto[] };

type FacilityWithDetailsRaw = Prisma.FacilityGetPayload<{
  include: {
    capacities: { include: { pflegegradPricing: true } };
    photos: true;
    reviews: true;
  };
}>;
export type FacilityWithDetails = Omit<FacilityWithDetailsRaw, "photos"> & {
  photos: FacilityPhoto[];
};

// Operator dashboard: full internal detail, including individual units and
// their active bookings (guest info, source) - this is the data behind the
// manual booking page (packages/api/src/routers/operator.ts).
type FacilityWithOperatorDetailsRaw = Prisma.FacilityGetPayload<{
  include: {
    capacities: { include: { pflegegradPricing: true } };
    photos: true;
    reviews: true;
    units: {
      include: {
        // isBevollmaechtigt lets the operator dashboard flag a booking as
        // coming from a Bevollmächtigte/r Angehörige/r account (see
        // User.vollmachtDocumentKey) - name/email intentionally not
        // included here, the operator already sees guestName on the
        // booking itself.
        bookings: { include: { user: { select: { vollmachtDocumentKey: true } } } };
      };
    };
  };
}>;
export type FacilityWithOperatorDetails = Omit<
  FacilityWithOperatorDetailsRaw,
  "photos"
> & { photos: FacilityPhoto[] };

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
