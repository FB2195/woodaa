-- CreateTable
CREATE TABLE "ResidentNote" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResidentNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResidentNote_bookingId_idx" ON "ResidentNote"("bookingId");

-- AddForeignKey
ALTER TABLE "ResidentNote" ADD CONSTRAINT "ResidentNote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
