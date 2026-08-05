-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "operatorPhoneDurchwahl" TEXT;

-- AlterTable
ALTER TABLE "FacilityChangeRequest" ADD COLUMN     "operatorPhoneDurchwahl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "agbAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "bevollmaechtigterAdresse" TEXT,
ADD COLUMN     "bevollmaechtigterEmail" TEXT,
ADD COLUMN     "bevollmaechtigterNachname" TEXT,
ADD COLUMN     "bevollmaechtigterTelefon" TEXT,
ADD COLUMN     "bevollmaechtigterVorname" TEXT,
ADD COLUMN     "city" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "datenschutzAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "geburtsdatum" TIMESTAMP(3),
ADD COLUMN     "hatBevollmaechtigten" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nachname" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "newsletterOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "postalCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "street" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vorname" TEXT NOT NULL DEFAULT '';

