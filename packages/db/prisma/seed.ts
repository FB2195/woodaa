import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const facilities = [
  {
    slug: "haus-am-tiergarten-berlin",
    name: "Haus am Tiergarten",
    description:
      "Familiär geführtes Pflegeheim direkt am Tiergarten mit hellen Zimmern, eigenem Garten und einem erfahrenen Team für Dauer- und Kurzzeitpflege.",
    street: "Bachstraße 12",
    postalCode: "10555",
    city: "Berlin",
    state: "Berlin",
    latitude: 52.5231,
    longitude: 13.3311,
    amenities: ["Barrierefreiheit", "Garten", "Einzelzimmer", "Cafeteria"],
    operatorName: "Sandra Vogel",
    operatorEmail: "leitung@haus-am-tiergarten.de",
    operatorPhone: "030 1234567",
    minPflegegrad: 0,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 40, availableSlots: 6, monthlyPriceCents: 220000 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 8, availableSlots: 2, monthlyPriceCents: 240000 },
    ],
  },
  {
    slug: "seniorenresidenz-isar-muenchen",
    name: "Seniorenresidenz Isar",
    description:
      "Moderne Seniorenresidenz nahe der Isar mit Tages- und Nachtpflege sowie stationären Plätzen, spezialisiert auf Demenzbetreuung.",
    street: "Rosenheimer Straße 88",
    postalCode: "81669",
    city: "München",
    state: "Bayern",
    latitude: 48.1257,
    longitude: 11.5944,
    amenities: ["Demenzbetreuung", "Barrierefreiheit", "Garten", "Physiotherapie"],
    operatorName: "Michael Brandt",
    operatorEmail: "info@seniorenresidenz-isar.de",
    operatorPhone: "089 7654321",
    minPflegegrad: 2,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 60, availableSlots: 3, monthlyPriceCents: 260000 },
      { bookingType: "TAGESPFLEGE", totalSlots: 14, availableSlots: 6, monthlyPriceCents: 110000 },
      { bookingType: "NACHTPFLEGE", totalSlots: 6, availableSlots: 3, monthlyPriceCents: 95000 },
    ],
  },
  {
    slug: "pflegehaus-elbufer-hamburg",
    name: "Pflegehaus Elbufer",
    description:
      "Pflegehaus mit Blick auf die Elbe, Schwerpunkt Kurzzeitpflege nach Krankenhausaufenthalten sowie Tagespflege für Berufstätige Angehörige.",
    street: "Elbchaussee 210",
    postalCode: "22605",
    city: "Hamburg",
    state: "Hamburg",
    latitude: 53.554,
    longitude: 9.8829,
    amenities: ["Einzelzimmer", "Cafeteria", "Physiotherapie"],
    operatorName: "Julia Nissen",
    operatorEmail: "kontakt@pflegehaus-elbufer.de",
    operatorPhone: "040 2345678",
    minPflegegrad: 0,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "KURZZEITPFLEGE", totalSlots: 15, availableSlots: 5, monthlyPriceCents: 250000 },
      { bookingType: "TAGESPFLEGE", totalSlots: 12, availableSlots: 4, monthlyPriceCents: 95000 },
    ],
  },
  {
    slug: "haus-rheinblick-koeln",
    name: "Haus Rheinblick",
    description:
      "Traditionsreiches Pflegeheim direkt am Rhein mit großzügigen Gemeinschaftsräumen, eigenem Garten und einem Fokus auf Dauerpflege.",
    street: "Rheinuferstraße 45",
    postalCode: "50678",
    city: "Köln",
    state: "Nordrhein-Westfalen",
    latitude: 50.9203,
    longitude: 6.9662,
    amenities: ["Garten", "Barrierefreiheit", "Cafeteria", "Seelsorge"],
    operatorName: "Thomas Krämer",
    operatorEmail: "leitung@haus-rheinblick.de",
    operatorPhone: "0221 3456789",
    minPflegegrad: 1,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 50, availableSlots: 1, monthlyPriceCents: 235000 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 6, availableSlots: 0, monthlyPriceCents: 245000 },
    ],
  },
  {
    slug: "pflegezentrum-auenpark-leipzig",
    name: "Pflegezentrum Auenpark",
    description:
      "Freundliches Pflegezentrum am Rand des Auenwalds mit modernen Einzelzimmern und einem breiten Angebot an Tages- und Nachtpflege.",
    street: "Parkallee 7",
    postalCode: "04177",
    city: "Leipzig",
    state: "Sachsen",
    latitude: 51.3162,
    longitude: 12.3223,
    amenities: ["Einzelzimmer", "Garten", "Demenzbetreuung"],
    operatorName: "Anke Wolff",
    operatorEmail: "info@pflegezentrum-auenpark.de",
    operatorPhone: "0341 4567890",
    minPflegegrad: 2,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 35, availableSlots: 8, monthlyPriceCents: 205000 },
      { bookingType: "TAGESPFLEGE", totalSlots: 18, availableSlots: 12, monthlyPriceCents: 90000 },
    ],
  },
  {
    slug: "haus-elbtal-dresden",
    name: "Haus Elbtal",
    description:
      "Kleines, persönlich geführtes Pflegeheim im Dresdner Elbtal mit besonderem Fokus auf individuelle Betreuung und Kurzzeitpflege.",
    street: "Elbtalweg 3",
    postalCode: "01067",
    city: "Dresden",
    state: "Sachsen",
    latitude: 51.0548,
    longitude: 13.7373,
    amenities: ["Barrierefreiheit", "Cafeteria", "Physiotherapie"],
    operatorName: "Robert Lange",
    operatorEmail: "kontakt@haus-elbtal.de",
    operatorPhone: "0351 5678901",
    minPflegegrad: 0,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 25, availableSlots: 4, monthlyPriceCents: 215000 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 5, availableSlots: 3, monthlyPriceCents: 230000 },
    ],
  },
] as const;

// Demo-Belegungszeitraum für date-basierte Kategorien (Kurzzeit-/Tages-/
// Nachtpflege), damit "aktuell belegt" auch stimmt, wenn man die Seed-Daten
// heute anschaut.
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const demoRangeStart = new Date(today);
demoRangeStart.setUTCDate(demoRangeStart.getUTCDate() - 5);
const demoRangeEnd = new Date(today);
demoRangeEnd.setUTCDate(demoRangeEnd.getUTCDate() + 10);

async function main() {
  for (const { capacities, ...facility } of facilities) {
    const created = await prisma.facility.upsert({
      where: { slug: facility.slug },
      // Backfills fields added after the initial seed on already-seeded
      // rows - safe to re-run, demo data only.
      update: {
        latitude: facility.latitude,
        longitude: facility.longitude,
        minPflegegrad: facility.minPflegegrad,
        maxPflegegrad: facility.maxPflegegrad,
      },
      create: { ...facility, status: "ACTIVE" },
    });

    for (const capacity of capacities) {
      const cap = await prisma.facilityCapacity.upsert({
        where: {
          facilityId_bookingType: { facilityId: created.id, bookingType: capacity.bookingType },
        },
        update: { monthlyPriceCents: capacity.monthlyPriceCents },
        create: {
          facilityId: created.id,
          bookingType: capacity.bookingType,
          totalSlots: 0,
          availableSlots: 0,
          monthlyPriceCents: capacity.monthlyPriceCents,
        },
      });

      // Units + Bookings sind der Wahrheitsträger - nur beim allerersten
      // Seed-Lauf für diese Kategorie provisionieren, sonst würde jeder
      // erneute Lauf weitere Plätze anhäufen.
      const existingUnitCount = await prisma.facilityUnit.count({
        where: { facilityId: created.id, bookingType: capacity.bookingType },
      });
      if (existingUnitCount === 0) {
        const units = await Promise.all(
          Array.from({ length: capacity.totalSlots }, (_, i) =>
            prisma.facilityUnit.create({
              data: {
                facilityId: created.id,
                bookingType: capacity.bookingType,
                label: `Platz ${i + 1}`,
              },
            }),
          ),
        );

        const isDateRanged = capacity.bookingType !== "STATIONAERE_AUFNAHME";
        const occupiedCount = capacity.totalSlots - capacity.availableSlots;
        for (let i = 0; i < occupiedCount; i++) {
          await prisma.booking.create({
            data: {
              facilityId: created.id,
              unitId: units[i].id,
              bookingType: capacity.bookingType,
              source: "TELEFON",
              guestName: "Demo-Beleger",
              startDate: isDateRanged ? demoRangeStart : null,
              endDate: isDateRanged ? demoRangeEnd : null,
            },
          });
        }
      }

      // Cache aus den echten Units/Bookings ableiten, statt die eingangs
      // hartkodierten Zahlen ungeprüft zu übernehmen - genau wie die App es
      // über availability.syncCapacityCache tut.
      const totalUnits = await prisma.facilityUnit.count({
        where: { facilityId: created.id, bookingType: capacity.bookingType },
      });
      const occupiedUnits = await prisma.booking.findMany({
        where: { facilityId: created.id, bookingType: capacity.bookingType, status: "BESTAETIGT" },
        select: { unitId: true },
        distinct: ["unitId"],
      });
      await prisma.facilityCapacity.update({
        where: { id: cap.id },
        data: { totalSlots: totalUnits, availableSlots: totalUnits - occupiedUnits.length },
      });
    }
  }
  console.log(`Seeded ${facilities.length} Pflegeheime.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
