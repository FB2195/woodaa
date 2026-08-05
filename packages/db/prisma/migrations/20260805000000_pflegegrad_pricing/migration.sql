-- CreateTable
CREATE TABLE "CapacityPflegegradPricing" (
    "id" TEXT NOT NULL,
    "capacityId" TEXT NOT NULL,
    "pflegegrad" INTEGER NOT NULL,
    "dailyRateCents" INTEGER,
    "monthlyRateCents" INTEGER,
    "hourlyRateCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapacityPflegegradPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CapacityPflegegradPricing_capacityId_pflegegrad_key" ON "CapacityPflegegradPricing"("capacityId", "pflegegrad");

-- AddForeignKey
ALTER TABLE "CapacityPflegegradPricing" ADD CONSTRAINT "CapacityPflegegradPricing_capacityId_fkey" FOREIGN KEY ("capacityId") REFERENCES "FacilityCapacity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
