-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('KARTE', 'KLARNA', 'PAYPAL', 'RECHNUNG', 'KOSTENUEBERNAHME_KASSE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('AUSSTEHEND', 'BEZAHLT', 'WARTET_AUF_HEIM_FREIGABE', 'FREIGEGEBEN', 'ABGELEHNT');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "paymentMethod" "PaymentMethod",
  ADD COLUMN "paymentStatus" "PaymentStatus",
  ADD COLUMN "stripePaymentIntentId" TEXT,
  ADD COLUMN "facilityApprovedAt" TIMESTAMP(3),
  ADD COLUMN "kostenuebernahmeDocumentKey" TEXT;

-- CreateIndex
CREATE INDEX "Booking_stripePaymentIntentId_idx" ON "Booking"("stripePaymentIntentId");
