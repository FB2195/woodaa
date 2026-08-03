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
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 40, availableSlots: 6 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 8, availableSlots: 2 },
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
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 60, availableSlots: 3 },
      { bookingType: "TAGES_NACHTPFLEGE", totalSlots: 20, availableSlots: 9 },
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
    capacities: [
      { bookingType: "KURZZEITPFLEGE", totalSlots: 15, availableSlots: 5 },
      { bookingType: "TAGES_NACHTPFLEGE", totalSlots: 12, availableSlots: 4 },
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
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 50, availableSlots: 1 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 6, availableSlots: 0 },
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
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 35, availableSlots: 8 },
      { bookingType: "TAGES_NACHTPFLEGE", totalSlots: 18, availableSlots: 12 },
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
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 25, availableSlots: 4 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 5, availableSlots: 3 },
    ],
  },
] as const;

async function main() {
  for (const { capacities, ...facility } of facilities) {
    await prisma.facility.upsert({
      where: { slug: facility.slug },
      // Backfills latitude/longitude on already-seeded rows from before
      // this field existed - safe to re-run, demo data only.
      update: { latitude: facility.latitude, longitude: facility.longitude },
      create: {
        ...facility,
        status: "ACTIVE",
        capacities: { create: capacities.map((c) => ({ ...c })) },
      },
    });
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
