-- CreateTable
CREATE TABLE "FacilityTask" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverNote" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoverNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacilityTask_facilityId_idx" ON "FacilityTask"("facilityId");

-- CreateIndex
CREATE INDEX "HandoverNote_facilityId_idx" ON "HandoverNote"("facilityId");

-- AddForeignKey
ALTER TABLE "FacilityTask" ADD CONSTRAINT "FacilityTask_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverNote" ADD CONSTRAINT "HandoverNote_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
