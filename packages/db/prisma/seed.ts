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
  {
    slug: "haus-am-mainufer-frankfurt",
    name: "Haus am Mainufer",
    description:
      "Zentral gelegenes Pflegehaus am Frankfurter Mainufer mit Dachterrasse, hauseigener Küche und einem Schwerpunkt auf stationärer Dauerpflege.",
    street: "Mainkai 34",
    postalCode: "60311",
    city: "Frankfurt am Main",
    state: "Hessen",
    latitude: 50.1109,
    longitude: 8.6821,
    amenities: ["Dachterrasse", "Einzelzimmer", "Cafeteria", "Barrierefreiheit"],
    operatorName: "Petra Sommer",
    operatorEmail: "leitung@haus-mainufer.de",
    operatorPhone: "069 2345671",
    minPflegegrad: 1,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 45, availableSlots: 7, monthlyPriceCents: 245000 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 10, availableSlots: 4, monthlyPriceCents: 255000 },
    ],
  },
  {
    slug: "seniorenzentrum-schlossgarten-stuttgart",
    name: "Seniorenzentrum Schlossgarten",
    description:
      "Seniorenzentrum in ruhiger Lage nahe dem Stuttgarter Schlossgarten, mit großzügiger Parkanlage und breitem Tagespflege-Angebot.",
    street: "Gartenstraße 21",
    postalCode: "70173",
    city: "Stuttgart",
    state: "Baden-Württemberg",
    latitude: 48.7758,
    longitude: 9.1829,
    amenities: ["Garten", "Physiotherapie", "Einzelzimmer", "Friseur"],
    operatorName: "Markus Feldmann",
    operatorEmail: "info@schlossgarten-seniorenzentrum.de",
    operatorPhone: "0711 3456712",
    minPflegegrad: 0,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 38, availableSlots: 2, monthlyPriceCents: 238000 },
      { bookingType: "TAGESPFLEGE", totalSlots: 16, availableSlots: 9, monthlyPriceCents: 105000 },
    ],
  },
  {
    slug: "pflegeresidenz-hofgarten-duesseldorf",
    name: "Pflegeresidenz Hofgarten",
    description:
      "Gehobene Pflegeresidenz nahe dem Düsseldorfer Hofgarten mit modernen Doppel- und Einzelzimmern sowie eigener Ergotherapie.",
    street: "Hofgartenring 5",
    postalCode: "40213",
    city: "Düsseldorf",
    state: "Nordrhein-Westfalen",
    latitude: 51.2277,
    longitude: 6.7735,
    amenities: ["Ergotherapie", "Einzelzimmer", "Garten", "Cafeteria"],
    operatorName: "Claudia Reinhardt",
    operatorEmail: "kontakt@hofgarten-residenz.de",
    operatorPhone: "0211 4567823",
    minPflegegrad: 2,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 55, availableSlots: 5, monthlyPriceCents: 265000 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 9, availableSlots: 1, monthlyPriceCents: 260000 },
      { bookingType: "NACHTPFLEGE", totalSlots: 5, availableSlots: 2, monthlyPriceCents: 98000 },
    ],
  },
  {
    slug: "haus-am-maschsee-hannover",
    name: "Haus am Maschsee",
    description:
      "Pflegeheim mit Seeblick am Hannoverschen Maschsee, bekannt für sein aktives Freizeitprogramm und die enge Angehörigenbegleitung.",
    street: "Seeuferstraße 18",
    postalCode: "30169",
    city: "Hannover",
    state: "Niedersachsen",
    latitude: 52.3759,
    longitude: 9.732,
    amenities: ["Garten", "Barrierefreiheit", "Cafeteria", "Seelsorge"],
    operatorName: "Frank Ahlers",
    operatorEmail: "leitung@haus-maschsee.de",
    operatorPhone: "0511 5678934",
    minPflegegrad: 0,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 30, availableSlots: 6, monthlyPriceCents: 210000 },
      { bookingType: "TAGESPFLEGE", totalSlots: 10, availableSlots: 5, monthlyPriceCents: 92000 },
    ],
  },
  {
    slug: "pflegehaus-burgblick-nuernberg",
    name: "Pflegehaus Burgblick",
    description:
      "Familiengeführtes Pflegehaus mit Blick auf die Nürnberger Burg, spezialisiert auf Kurzzeitpflege nach Reha- und Krankenhausaufenthalten.",
    street: "Burgstraße 9",
    postalCode: "90403",
    city: "Nürnberg",
    state: "Bayern",
    latitude: 49.4521,
    longitude: 11.0767,
    amenities: ["Einzelzimmer", "Physiotherapie", "Cafeteria"],
    operatorName: "Elisabeth Hartmann",
    operatorEmail: "info@pflegehaus-burgblick.de",
    operatorPhone: "0911 6789045",
    minPflegegrad: 0,
    maxPflegegrad: 4,
    capacities: [
      { bookingType: "KURZZEITPFLEGE", totalSlots: 14, availableSlots: 6, monthlyPriceCents: 248000 },
      { bookingType: "TAGESPFLEGE", totalSlots: 8, availableSlots: 3, monthlyPriceCents: 98000 },
    ],
  },
  {
    slug: "seniorenheim-am-weserdeich-bremen",
    name: "Seniorenheim am Weserdeich",
    description:
      "Ruhig gelegenes Seniorenheim am Bremer Weserdeich mit hauseigenem Garten, Kapelle und einem erfahrenen Team für Dauerpflege.",
    street: "Deichweg 61",
    postalCode: "28195",
    city: "Bremen",
    state: "Bremen",
    latitude: 53.0793,
    longitude: 8.8017,
    amenities: ["Garten", "Seelsorge", "Barrierefreiheit", "Einzelzimmer"],
    operatorName: "Dirk Meinecke",
    operatorEmail: "leitung@weserdeich-seniorenheim.de",
    operatorPhone: "0421 7890156",
    minPflegegrad: 1,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 42, availableSlots: 0, monthlyPriceCents: 218000 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 7, availableSlots: 2, monthlyPriceCents: 228000 },
    ],
  },
  {
    slug: "pflegezentrum-baldeneysee-essen",
    name: "Pflegezentrum Baldeneysee",
    description:
      "Pflegezentrum nahe dem Essener Baldeneysee mit großzügiger Gartenanlage und breitem Angebot an Tages- und Nachtpflege.",
    street: "Uferpromenade 14",
    postalCode: "45239",
    city: "Essen",
    state: "Nordrhein-Westfalen",
    latitude: 51.4556,
    longitude: 7.0116,
    amenities: ["Garten", "Demenzbetreuung", "Physiotherapie"],
    operatorName: "Ingrid Klose",
    operatorEmail: "info@pflegezentrum-baldeneysee.de",
    operatorPhone: "0201 8901267",
    minPflegegrad: 2,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 33, availableSlots: 4, monthlyPriceCents: 208000 },
      { bookingType: "TAGESPFLEGE", totalSlots: 12, availableSlots: 7, monthlyPriceCents: 88000 },
      { bookingType: "NACHTPFLEGE", totalSlots: 4, availableSlots: 1, monthlyPriceCents: 90000 },
    ],
  },
  {
    slug: "haus-westfalenpark-dortmund",
    name: "Haus Westfalenpark",
    description:
      "Modernes Pflegehaus am Rande des Dortmunder Westfalenparks mit lichtdurchfluteten Zimmern und aktivierender Pflege.",
    street: "Parkring 27",
    postalCode: "44139",
    city: "Dortmund",
    state: "Nordrhein-Westfalen",
    latitude: 51.5136,
    longitude: 7.4653,
    amenities: ["Barrierefreiheit", "Garten", "Cafeteria", "Friseur"],
    operatorName: "Bernd Kaiser",
    operatorEmail: "kontakt@haus-westfalenpark.de",
    operatorPhone: "0231 9012378",
    minPflegegrad: 0,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 48, availableSlots: 9, monthlyPriceCents: 225000 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 11, availableSlots: 5, monthlyPriceCents: 235000 },
    ],
  },
  {
    slug: "seniorenresidenz-wasserturm-mannheim",
    name: "Seniorenresidenz Wasserturm",
    description:
      "Seniorenresidenz im Herzen Mannheims, benannt nach dem nahegelegenen Wasserturm, mit besonderem Augenmerk auf Palliativbegleitung.",
    street: "Turmstraße 8",
    postalCode: "68161",
    city: "Mannheim",
    state: "Baden-Württemberg",
    latitude: 49.4875,
    longitude: 8.466,
    amenities: ["Palliativpflege", "Einzelzimmer", "Cafeteria", "Seelsorge"],
    operatorName: "Susanne Ott",
    operatorEmail: "leitung@wasserturm-residenz.de",
    operatorPhone: "0621 0123489",
    minPflegegrad: 2,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 40, availableSlots: 3, monthlyPriceCents: 232000 },
      { bookingType: "KURZZEITPFLEGE", totalSlots: 8, availableSlots: 0, monthlyPriceCents: 242000 },
    ],
  },
  {
    slug: "pflegehaus-schwarzwaldblick-freiburg",
    name: "Pflegehaus Schwarzwaldblick",
    description:
      "Pflegehaus am Freiburger Stadtrand mit Blick auf den Schwarzwald, großem Garten und einem breiten teilstationären Angebot.",
    street: "Waldrandweg 16",
    postalCode: "79098",
    city: "Freiburg im Breisgau",
    state: "Baden-Württemberg",
    latitude: 47.999,
    longitude: 7.8421,
    amenities: ["Garten", "Barrierefreiheit", "Physiotherapie", "Cafeteria"],
    operatorName: "Werner Baumann",
    operatorEmail: "info@schwarzwaldblick-pflege.de",
    operatorPhone: "0761 1234590",
    minPflegegrad: 0,
    maxPflegegrad: 5,
    capacities: [
      { bookingType: "STATIONAERE_AUFNAHME", totalSlots: 28, availableSlots: 5, monthlyPriceCents: 212000 },
      { bookingType: "TAGESPFLEGE", totalSlots: 15, availableSlots: 10, monthlyPriceCents: 87000 },
      { bookingType: "NACHTPFLEGE", totalSlots: 5, availableSlots: 3, monthlyPriceCents: 89000 },
    ],
  },
] as const;

// Standard-Foto-Set pro Einrichtung: 8 Platzhalter-Kacheln (Außenansicht
// zuerst, damit die Suchkarte ein "Gebäude" statt ein Zimmer als Titelbild
// zeigt), ohne echten Upload - siehe FacilityPhoto.key in schema.prisma.
const photoPlan = [
  "AUSSENANSICHT",
  "AUSSENANSICHT",
  "GARTEN",
  "GARTEN",
  "STATION",
  "STATION",
  "ZIMMER",
  "ZIMMER",
] as const;

// Demo-Belegungszeitraum für date-basierte Kategorien (Kurzzeit-/Tages-/
// Nachtpflege). Jede belegte Einheit bekommt einen leicht versetzten
// Zeitraum (statt für alle denselben), damit "bereits belegte Zeiträume"
// auf der Detailseite nicht wie eine einzige, x-fach wiederholte Buchung
// aussieht - aber jeder Zeitraum umfasst weiterhin "heute", damit die
// eingangs angegebenen availableSlots-Zahlen nach dem Sync stimmen.
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
// Moduli chosen coprime and well above any realistic occupied-unit count
// (max ~15 in the seed data) so the (start, end) pair doesn't cycle back to
// an earlier value within one facility/category - a smaller modulus (e.g.
// 10) has too short a period and starts repeating well before that.
function demoRangeFor(index: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - (3 + ((index * 7) % 23)));
  const endDate = new Date(today);
  endDate.setUTCDate(endDate.getUTCDate() + (5 + ((index * 11) % 29)));
  return { startDate, endDate };
}

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
          const range = isDateRanged ? demoRangeFor(i) : null;
          await prisma.booking.create({
            data: {
              facilityId: created.id,
              unitId: units[i].id,
              bookingType: capacity.bookingType,
              source: "TELEFON",
              guestName: "Demo-Beleger",
              startDate: range?.startDate ?? null,
              endDate: range?.endDate ?? null,
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

    // Nur beim allerersten Lauf befüllen, sonst würden erneute Seed-Läufe
    // Fotos anhäufen statt sie stabil zu halten.
    const existingPhotoCount = await prisma.facilityPhoto.count({
      where: { facilityId: created.id },
    });
    if (existingPhotoCount === 0) {
      for (const category of photoPlan) {
        await prisma.facilityPhoto.create({
          data: { facilityId: created.id, category, key: null },
        });
      }
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
