-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN     "escalatedAt" TIMESTAMP(3),
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "BookingRequest_facilityId_status_idx" ON "BookingRequest"("facilityId", "status");
