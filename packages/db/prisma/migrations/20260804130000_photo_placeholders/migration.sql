-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('AUSSENANSICHT', 'GARTEN', 'STATION', 'ZIMMER', 'SONSTIGE');

-- AlterTable
ALTER TABLE "FacilityPhoto" ADD COLUMN     "category" "PhotoCategory",
ALTER COLUMN "key" DROP NOT NULL;

