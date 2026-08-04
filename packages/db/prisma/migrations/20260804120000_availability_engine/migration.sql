-- CreateEnum
CREATE TYPE "UnitBookingSource" AS ENUM ('ONLINE', 'TELEFON', 'VOR_ORT');

-- CreateEnum
CREATE TYPE "UnitBookingStatus" AS ENUM ('BESTAETIGT', 'STORNIERT');

-- AlterEnum
-- The original BookingType only had 3 values, with TAGES_NACHTPFLEGE
-- covering both day and night care as one combined category. Splitting it
-- into TAGESPFLEGE/NACHTPFLEGE means existing rows holding the old
-- combined label have no matching new label, so a plain text cast fails on
-- any such row - remap it to TAGESPFLEGE (arbitrary but deterministic)
-- as part of the cast instead of a bare ::"BookingType_new".
BEGIN;
CREATE TYPE "BookingType_new" AS ENUM ('STATIONAERE_AUFNAHME', 'KURZZEITPFLEGE', 'TAGESPFLEGE', 'NACHTPFLEGE');
ALTER TABLE "FacilityCapacity" ALTER COLUMN "bookingType" TYPE "BookingType_new" USING (
  CASE "bookingType"::text WHEN 'TAGES_NACHTPFLEGE' THEN 'TAGESPFLEGE' ELSE "bookingType"::text END
)::"BookingType_new";
ALTER TABLE "BookingRequest" ALTER COLUMN "bookingType" TYPE "BookingType_new" USING (
  CASE "bookingType"::text WHEN 'TAGES_NACHTPFLEGE' THEN 'TAGESPFLEGE' ELSE "bookingType"::text END
)::"BookingType_new";
ALTER TYPE "BookingType" RENAME TO "BookingType_old";
ALTER TYPE "BookingType_new" RENAME TO "BookingType";
DROP TYPE "BookingType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "KurzzeitpflegeBooking" DROP CONSTRAINT "KurzzeitpflegeBooking_facilityId_fkey";

-- AlterTable
ALTER TABLE "FacilityCapacity" DROP COLUMN "weekdaySlots";

-- DropTable
DROP TABLE "KurzzeitpflegeBooking";

-- CreateTable
CREATE TABLE "FacilityUnit" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL,
    "source" "UnitBookingSource" NOT NULL,
    "status" "UnitBookingStatus" NOT NULL DEFAULT 'BESTAETIGT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacilityUnit_facilityId_bookingType_idx" ON "FacilityUnit"("facilityId", "bookingType");

-- CreateIndex
CREATE INDEX "Booking_facilityId_bookingType_idx" ON "Booking"("facilityId", "bookingType");

-- CreateIndex
CREATE INDEX "Booking_unitId_status_idx" ON "Booking"("unitId", "status");

-- AddForeignKey
ALTER TABLE "FacilityUnit" ADD CONSTRAINT "FacilityUnit_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FacilityUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Both startDate and endDate must be set together (KURZZEITPFLEGE /
-- TAGESPFLEGE / NACHTPFLEGE) or both left null (STATIONAERE_AUFNAHME,
-- unbefristet). Prevents a half-filled row from ever reaching the
-- exclusion constraint below with unintended open-ended semantics.
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_date_range_consistent"
  CHECK (("startDate" IS NULL) = ("endDate" IS NULL));

-- btree_gist lets a plain equality column (unitId) participate in a GIST
-- exclusion constraint alongside a range type.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- The actual double-booking lock. Two active (BESTAETIGT) bookings on the
-- same unit can never coexist if their date ranges overlap - enforced by
-- Postgres itself at INSERT time, not by application-level locking/retries,
-- so it holds under any concurrency level, including two simultaneous
-- writers that never see each other's in-flight transaction.
--
-- daterange(startDate, endDate, '[]') is inclusive on both ends (the end
-- day counts as occupied); a NULL bound is unbounded per Postgres' range
-- constructor semantics, so a STATIONAERE_AUFNAHME row (both null) excludes
-- every other booking on that unit, which is exactly "occupied
-- indefinitely". WHERE (status = 'BESTAETIGT') means cancelled bookings
-- never block a unit from being rebooked.
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_overlap_per_unit"
  EXCLUDE USING gist (
    "unitId" WITH =,
    daterange(("startDate")::date, ("endDate")::date, '[]') WITH &&
  )
  WHERE ("status" = 'BESTAETIGT');

