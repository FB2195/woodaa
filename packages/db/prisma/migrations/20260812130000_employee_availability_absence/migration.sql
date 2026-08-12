-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('VOLLZEIT', 'TEILZEIT', 'MINIJOB');

-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('URLAUB', 'KRANKHEIT', 'SONSTIGES');

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('AUSSTEHEND', 'GENEHMIGT', 'ABGELEHNT');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "employmentType" "EmploymentType",
ADD COLUMN     "weeklyHoursTarget" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "EmployeeAvailability" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "type" "AbsenceType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "AbsenceStatus" NOT NULL DEFAULT 'AUSSTEHEND',
    "note" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeAvailability_employeeId_idx" ON "EmployeeAvailability"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAvailability_employeeId_weekday_key" ON "EmployeeAvailability"("employeeId", "weekday");

-- CreateIndex
CREATE INDEX "Absence_facilityId_startDate_idx" ON "Absence"("facilityId", "startDate");

-- CreateIndex
CREATE INDEX "Absence_employeeId_idx" ON "Absence"("employeeId");

-- AddForeignKey
ALTER TABLE "EmployeeAvailability" ADD CONSTRAINT "EmployeeAvailability_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
