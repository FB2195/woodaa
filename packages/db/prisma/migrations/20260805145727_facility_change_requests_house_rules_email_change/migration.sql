-- CreateEnum
CREATE TYPE "FacilityChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkOutTime" TEXT,
ADD COLUMN     "parkingInfo" TEXT,
ADD COLUMN     "petsPolicy" TEXT,
ADD COLUMN     "visitingHours" TEXT,
ADD COLUMN     "wifiInfo" TEXT;

-- CreateTable
CREATE TABLE "EmailChangeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "oldEmailTokenHash" TEXT NOT NULL,
    "newEmailTokenHash" TEXT,
    "oldConfirmedAt" TIMESTAMP(3),
    "newConfirmedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityChangeRequest" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT,
    "street" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "state" TEXT,
    "operatorName" TEXT,
    "operatorEmail" TEXT,
    "operatorPhone" TEXT,
    "status" "FacilityChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailChangeRequest_oldEmailTokenHash_key" ON "EmailChangeRequest"("oldEmailTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "EmailChangeRequest_newEmailTokenHash_key" ON "EmailChangeRequest"("newEmailTokenHash");

-- CreateIndex
CREATE INDEX "EmailChangeRequest_userId_idx" ON "EmailChangeRequest"("userId");

-- CreateIndex
CREATE INDEX "FacilityChangeRequest_facilityId_idx" ON "FacilityChangeRequest"("facilityId");

-- CreateIndex
CREATE INDEX "FacilityChangeRequest_status_idx" ON "FacilityChangeRequest"("status");

-- AddForeignKey
ALTER TABLE "EmailChangeRequest" ADD CONSTRAINT "EmailChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityChangeRequest" ADD CONSTRAINT "FacilityChangeRequest_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

