-- CreateEnum
CREATE TYPE "SupportRequestType" AS ENUM ('KONTAKT', 'RUECKRUF', 'FEHLERMELDUNG');

-- CreateEnum
CREATE TYPE "SupportRequestStatus" AS ENUM ('OFFEN', 'BEARBEITET', 'ERLEDIGT');

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "type" "SupportRequestType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "pageUrl" TEXT,
    "userId" TEXT,
    "status" "SupportRequestStatus" NOT NULL DEFAULT 'OFFEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
