-- CreateEnum
CREATE TYPE "CareApplicationStatus" AS ENUM ('BEREITS_BEANTRAGT', 'MUSS_BEANTRAGT_WERDEN', 'EINGEREICHT_UEBER_WOODAA');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "versicherungsnummerEncrypted" TEXT,
  ADD COLUMN "pflegegrad" INTEGER,
  ADD COLUMN "pflegegradAntragLaeuft" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CareApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL,
    "status" "CareApplicationStatus" NOT NULL DEFAULT 'MUSS_BEANTRAGT_WERDEN',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareApplication_userId_bookingType_key" ON "CareApplication"("userId", "bookingType");

-- AddForeignKey
ALTER TABLE "CareApplication" ADD CONSTRAINT "CareApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
