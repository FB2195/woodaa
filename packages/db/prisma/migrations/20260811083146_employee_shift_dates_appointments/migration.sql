/*
  Warnings:

  - You are about to drop the column `label` on the `EmployeeShift` table. All the data in the column will be lost.
  - You are about to drop the column `weekday` on the `EmployeeShift` table. All the data in the column will be lost.
  - Added the required column `date` to the `EmployeeShift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `EmployeeShift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `facilityId` to the `EmployeeShift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `EmployeeShift` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AppointmentCategory" AS ENUM ('ARZTTERMIN', 'BESUCH', 'INTERN', 'SONSTIGES');

-- DropIndex
DROP INDEX "EmployeeShift_employeeId_idx";

-- DropIndex
DROP INDEX "EmployeeShift_employeeId_weekday_key";

-- AlterTable
ALTER TABLE "EmployeeShift" DROP COLUMN "label",
DROP COLUMN "weekday",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "facilityId" TEXT NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "shiftType" TEXT,
ADD COLUMN     "startTime" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "FacilityAppointment" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "title" TEXT NOT NULL,
    "category" "AppointmentCategory" NOT NULL DEFAULT 'SONSTIGES',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacilityAppointment_facilityId_date_idx" ON "FacilityAppointment"("facilityId", "date");

-- CreateIndex
CREATE INDEX "EmployeeShift_employeeId_date_idx" ON "EmployeeShift"("employeeId", "date");

-- CreateIndex
CREATE INDEX "EmployeeShift_facilityId_date_idx" ON "EmployeeShift"("facilityId", "date");

-- AddForeignKey
ALTER TABLE "EmployeeShift" ADD CONSTRAINT "EmployeeShift_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityAppointment" ADD CONSTRAINT "FacilityAppointment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
