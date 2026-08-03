-- CreateTable
CREATE TABLE "FacilityPhoto" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacilityPhoto_facilityId_idx" ON "FacilityPhoto"("facilityId");

-- AddForeignKey
ALTER TABLE "FacilityPhoto" ADD CONSTRAINT "FacilityPhoto_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

