-- Review eligibility switches from an anonymous email-match-a-BookingRequest
-- check to a real authenticated User with a confirmed Booking. No production
-- review rows exist yet, so this is a plain destructive column swap rather
-- than a backfill.

-- DropIndex
DROP INDEX "Review_facilityId_reviewerEmail_key";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "reviewerEmail",
ADD COLUMN "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Review_facilityId_userId_key" ON "Review"("facilityId", "userId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
