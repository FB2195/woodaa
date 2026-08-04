-- CreateEnum
CREATE TYPE "VollmachtReviewStatus" AS ENUM ('AUSSTEHEND', 'GEPRUEFT', 'ABGELEHNT');

-- CreateEnum
CREATE TYPE "BookingAdminApprovalStatus" AS ENUM ('NICHT_ERFORDERLICH', 'AUSSTEHEND', 'FREIGEGEBEN', 'ABGELEHNT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "careRecipientName" TEXT,
  ADD COLUMN "vollmachtDocumentKey" TEXT,
  ADD COLUMN "vollmachtReviewStatus" "VollmachtReviewStatus",
  ADD COLUMN "vollmachtReviewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "adminApprovalStatus" "BookingAdminApprovalStatus" NOT NULL DEFAULT 'NICHT_ERFORDERLICH',
  ADD COLUMN "adminApprovedAt" TIMESTAMP(3);
