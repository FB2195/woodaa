-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "cancellationPolicyDays" INTEGER,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "approvalReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "approvalEscalatedAt" TIMESTAMP(3);
