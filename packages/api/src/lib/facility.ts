import { Prisma } from "@prisma/client";
import { geocodeAddress } from "../geocoding";
import { slugify } from "./slugify";

// A PrismaClient satisfies this structurally (it has every method Tx has,
// plus more), so callers can pass either ctx.db or a $transaction callback's
// tx - same pattern as availability.ts's setUnitCount/createBooking.
type Tx = Prisma.TransactionClient;

export async function uniqueSlugFor(
  db: Tx,
  name: string,
  city: string,
): Promise<string> {
  const base = slugify(`${name}-${city}`);
  let slug = base;
  let suffix = 1;
  while (await db.facility.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

type FacilityCreateFields = {
  name: string;
  description: string;
  street: string;
  postalCode: string;
  city: string;
  state: string;
  amenities: string[];
  operatorPhone?: string;
  operatorPhoneDurchwahl?: string;
  minPflegegrad?: number;
  maxPflegegrad?: number;
};

// Shared by operator.createFacility (the standalone "create a facility"
// step, still used as a fallback for accounts without one - e.g. accounts
// from before facility creation moved into registration) and
// auth.register's BETREIBER path (facility now created in the same step as
// the account, see RegisterBetreiberInput).
export async function createFacilityForOperator(
  db: Tx,
  user: { id: string; name: string; email: string },
  input: FacilityCreateFields,
) {
  const slug = await uniqueSlugFor(db, input.name, input.city);
  // Best-effort - a facility is still created even if geocoding fails or
  // Nominatim is unreachable, it just won't show on the map yet.
  const geo = await geocodeAddress(
    `${input.street}, ${input.postalCode} ${input.city}, Germany`,
  );

  return db.facility.create({
    data: {
      ...input,
      slug,
      status: "PENDING_REVIEW",
      operatorName: user.name,
      operatorEmail: user.email,
      operatorUserId: user.id,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
    },
  });
}
