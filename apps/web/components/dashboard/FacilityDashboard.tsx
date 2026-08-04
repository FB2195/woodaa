import type { BookingType } from "@woodaa/validators";
import type { FacilityWithOperatorDetails } from "@woodaa/api";
import { CategoryPanel } from "./CategoryPanel";
import { PflegegradSuitabilityForm } from "./PflegegradSuitabilityForm";
import { PhotoManager } from "./PhotoManager";

type Facility = FacilityWithOperatorDetails;

const allBookingTypes: BookingType[] = [
  "STATIONAERE_AUFNAHME",
  "KURZZEITPFLEGE",
  "TAGESPFLEGE",
  "NACHTPFLEGE",
];

const statusLabels: Record<Facility["status"], string> = {
  ACTIVE: "Live",
  PENDING_REVIEW: "Wird geprüft",
  REJECTED: "Abgelehnt",
};

export function FacilityDashboard({ facility }: { facility: Facility }) {
  const capacityByType = Object.fromEntries(
    facility.capacities.map((c) => [c.bookingType, c]),
  );
  const unitsByType = Object.fromEntries(
    allBookingTypes.map((type) => [
      type,
      facility.units.filter((u) => u.bookingType === type),
    ]),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-primary-dark">
            {facility.name}
          </h1>
          <span
            className={`rounded-brand-full px-3 py-1 text-xs font-medium ${
              facility.status === "ACTIVE"
                ? "bg-brand-accent/10 text-brand-accent"
                : "bg-brand-border text-brand-text-muted"
            }`}
          >
            {statusLabels[facility.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-brand-text-muted">
          {facility.street}, {facility.postalCode} {facility.city}
        </p>
        {facility.status === "PENDING_REVIEW" && (
          <p className="mt-3 text-sm text-brand-text-muted">
            Deine Einrichtung wird gerade von unserem Team geprüft und ist
            noch nicht öffentlich sichtbar.
          </p>
        )}
        {facility.status === "REJECTED" && (
          <p className="mt-3 text-sm text-red-600">
            Deine Einrichtung wurde nicht freigeschaltet. Melde dich gerne bei
            uns, falls das ein Irrtum war.
          </p>
        )}
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

      <PflegegradSuitabilityForm
        minPflegegrad={facility.minPflegegrad}
        maxPflegegrad={facility.maxPflegegrad}
      />

      <PhotoManager photos={facility.photos} />
    </div>
  );
}
