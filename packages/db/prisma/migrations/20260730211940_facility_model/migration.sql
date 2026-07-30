-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('STATIONAERE_AUFNAHME', 'KURZZEITPFLEGE', 'TAGES_NACHTPFLEGE');

-- CreateEnum
CREATE TYPE "FacilityStatus" AS ENUM ('ACTIVE', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "BookingRequestStatus" AS ENUM ('OFFEN', 'KONTAKTIERT', 'ABGESCHLOSSEN', 'ABGELEHNT');

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "amenities" TEXT[],
    "status" "FacilityStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "operatorName" TEXT NOT NULL,
    "operatorEmail" TEXT NOT NULL,
    "operatorPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityCapacity" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL,
    "totalSlots" INTEGER NOT NULL,
    "availableSlots" INTEGER NOT NULL,

    CONSTRAINT "FacilityCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterPhone" TEXT,
    "pflegegrad" INTEGER,
    "message" TEXT,
    "desiredStart" TIMESTAMP(3),
    "status" "BookingRequestStatus" NOT NULL DEFAULT 'OFFEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Facility_slug_key" ON "Facility"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityCapacity_facilityId_bookingType_key" ON "FacilityCapacity"("facilityId", "bookingType");

-- AddForeignKey
ALTER TABLE "FacilityCapacity" ADD CONSTRAINT "FacilityCapacity_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
