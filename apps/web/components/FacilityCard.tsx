import type { FacilityWithCapacities } from "@woodaa/api";
import Link from "next/link";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { FavoriteButton } from "@/components/FavoriteButton";

type Facility = FacilityWithCapacities;

export function FacilityCard({
  facility,
  initialFavorited = false,
}: {
  facility: Facility;
  initialFavorited?: boolean;
}) {
  return (
    <Link
      href={`/einrichtung/${facility.slug}`}
      className="relative block rounded-brand-lg border border-brand-border bg-brand-surface p-6 shadow-sm transition hover:shadow-md"
    >
      <FavoriteButton
        facilityId={facility.id}
        initialFavorited={initialFavorited}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-brand-full border border-brand-border bg-brand-surface text-lg shadow-sm transition hover:bg-brand-background"
      />
      <h3 className="pr-10 text-lg font-semibold text-brand-primary-dark">
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
