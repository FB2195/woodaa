-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "maxPflegegrad" INTEGER,
ADD COLUMN     "minPflegegrad" INTEGER;

-- AlterTable
ALTER TABLE "FacilityCapacity" ADD COLUMN     "monthlyPriceCents" INTEGER;

