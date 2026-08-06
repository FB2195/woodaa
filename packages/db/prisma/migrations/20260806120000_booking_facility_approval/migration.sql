-- CreateEnum
CREATE TYPE "BookingApprovalMode" AS ENUM ('AUTOMATISCH', 'MANUELL');

-- CreateEnum
CREATE TYPE "BookingFacilityApprovalStatus" AS ENUM ('NICHT_ERFORDERLICH', 'AUSSTEHEND', 'BESTAETIGT', 'ABGELEHNT');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "facilityApprovalStatus" "BookingFacilityApprovalStatus" NOT NULL DEFAULT 'NICHT_ERFORDERLICH',
ADD COLUMN     "facilityDecisionAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "bookingApprovalMode" "BookingApprovalMode" NOT NULL DEFAULT 'AUTOMATISCH';

