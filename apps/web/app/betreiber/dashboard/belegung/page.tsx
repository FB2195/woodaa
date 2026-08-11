import type { BookingType } from "@woodaa/validators";
import { CategoryPanel } from "@/components/dashboard/CategoryPanel";
import { getMyFacility } from "@/lib/operatorData";

const allBookingTypes: BookingType[] = [
  "STATIONAERE_AUFNAHME",
  "KURZZEITPFLEGE",
  "TAGESPFLEGE",
  "NACHTPFLEGE",
];

export default async function OperatorBelegungPage() {
  const facility = await getMyFacility();
  if (!facility) return null;

  const capacityByType = Object.fromEntries(facility.capacities.map((c) => [c.bookingType, c]));
  const unitsByType = Object.fromEntries(
    allBookingTypes.map((type) => [type, facility.units.filter((u) => u.bookingType === type)]),
  );

  return (
    <>
      <div>
        <h1 className="text-xl font-bold text-brand-heading">Belegung</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Plätze je Pflegeart einrichten, umbenennen und Buchungen von Hand erfassen oder
          stornieren.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {allBookingTypes.map((type) => (
          <CategoryPanel
            key={type}
            bookingType={type}
            capacity={capacityByType[type]}
            units={unitsByType[type] ?? []}
          />
        ))}
      </div>
    </>
  );
}
