-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyMessagesEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyMessagesPush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySavedSearchEmail" BOOLEAN NOT NULL DEFAULT true;
