-- AlterTable
ALTER TABLE "User" ADD COLUMN "krankenkasse" TEXT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "userId" TEXT,
  ADD COLUMN "guestFirstName" TEXT,
  ADD COLUMN "guestLastName" TEXT,
  ADD COLUMN "guestBirthDate" TIMESTAMP(3),
  ADD COLUMN "guestStreet" TEXT,
  ADD COLUMN "guestPostalCode" TEXT,
  ADD COLUMN "guestCity" TEXT,
  ADD COLUMN "krankenkasse" TEXT,
  ADD COLUMN "versicherungsnummerEncrypted" TEXT,
  ADD COLUMN "pflegegrad" INTEGER,
  ADD COLUMN "pflegegradAntragLaeuft" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "desiredStartDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Relax the date-range check: previously only both-null (STATIONAERE_AUFNAHME,
-- unbefristet) or both-set was allowed. Now start-set/end-null ("Ende offen"
-- - an ongoing Tages-/Nachtpflege booking with no planned end date) is also
-- valid; the GIST exclusion constraint below already handles an unbounded
-- upper bound correctly via daterange()'s semantics. Only start-null/end-set
-- stays disallowed (never a sensible state).
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_date_range_consistent";
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_date_range_consistent"
  CHECK (NOT ("startDate" IS NULL AND "endDate" IS NOT NULL));
