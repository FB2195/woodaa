-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUCHENDE', 'BETREIBER', 'ADMIN');

-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN     "desiredEnd" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "operatorUserId" TEXT;

-- AlterTable
ALTER TABLE "FacilityCapacity" ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "weekdaySlots" JSONB;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUCHENDE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KurzzeitpflegeBooking" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KurzzeitpflegeBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_operatorUserId_key" ON "Facility"("operatorUserId");

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_operatorUserId_fkey" FOREIGN KEY ("operatorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KurzzeitpflegeBooking" ADD CONSTRAINT "KurzzeitpflegeBooking_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

