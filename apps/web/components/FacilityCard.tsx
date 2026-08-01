import type { FacilityWithCapacities } from "@woodaa/api";
import Link from "next/link";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";

type Facility = FacilityWithCapacities;

export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <Link
      href={`/einrichtung/${facility.slug}`}
      className="block rounded-brand-lg border border-brand-border bg-brand-surface p-6 shadow-sm transition hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-brand-primary-dark">
        {facility.name}
      </h3>
      <p className="mt-1 text-sm text-brand-text-muted">
        {facility.city}, {facility.state}
      </p>
      <p className="mt-3 line-clamp-2 text-sm text-brand-text">
        {facility.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {facility.capacities.map((capacity) => (
          <span
            key={capacity.id}
            className={`rounded-brand-full px-3 py-1 text-xs font-medium ${
              capacity.availableSlots > 0
                ? "bg-brand-accent/10 text-brand-accent"
                : "bg-brand-border text-brand-text-muted"
            }`}
          >
            {bookingTypeLabels[capacity.bookingType]}
            {capacity.availableSlots > 0
              ? ` · ${capacity.availableSlots} frei`
              : " · belegt"}
          </span>
        ))}
      </div>
    </Link>
  );
}
