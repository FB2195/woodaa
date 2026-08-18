import { db } from "@woodaa/db";

// Guards every helper here against accidentally running against the real
// dev/prod database - vitest.config.ts points DATABASE_URL at a dedicated
// woodaa_test database, this is a second, independent check in case that
// env var ever gets overridden by something else.
function assertTestDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("woodaa_test")) {
    throw new Error(
      `Refusing to run test DB helpers against a database that doesn't look like the test DB: ${url}`,
    );
  }
}

// Truncates every table between tests - cheap enough for this schema's
// size, and simpler/less error-prone than tracking per-test cleanup.
// CASCADE handles FK order; RESTART IDENTITY keeps ids predictable across
// runs (not that any test currently depends on that).
export async function resetTestDb(): Promise<void> {
  assertTestDatabase();
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;
  if (tables.length === 0) return;
  const names = tables.map((t) => `"${t.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
}

// Minimal valid Facility + one FacilityUnit for the given bookingType -
// just enough for availability.ts's createBooking/cancelBooking to run
// against, not a full realistic fixture (no capacities/pricing - tests
// that need pricing build that themselves).
export async function createTestFacilityWithUnit(bookingType: BookingTypeForFixture) {
  const facility = await db.facility.create({
    data: {
      slug: `test-facility-${crypto.randomUUID()}`,
      name: "Testheim",
      street: "Teststraße 1",
      postalCode: "12345",
      city: "Teststadt",
      state: "Berlin",
      operatorName: "Test Betreiber",
      operatorEmail: "operator@example.test",
      status: "ACTIVE",
    },
  });
  const unit = await db.facilityUnit.create({
    data: { facilityId: facility.id, bookingType, label: "Zimmer 1" },
  });
  return { facility, unit };
}

type BookingTypeForFixture =
  "STATIONAERE_AUFNAHME" | "KURZZEITPFLEGE" | "TAGESPFLEGE" | "NACHTPFLEGE";
