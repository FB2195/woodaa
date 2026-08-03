import type { FacilityWithCapacities } from "@woodaa/api";
import Image from "next/image";
import Link from "next/link";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatDistanceKm, formatPriceEuro } from "@/lib/format";
import { cheapestCapacityPrice } from "@/lib/price";

// distanceKm is only present when the search had a resolvable origin
// (facility.list computes it) - absent e.g. on /favoriten, which reuses
// this same card with plain FacilityWithCapacities.
type Facility = FacilityWithCapacities & { distanceKm?: number | null };

export function FacilityCard({
  facility,
  initialFavorited = false,
}: {
  facility: Facility;
  initialFavorited?: boolean;
}) {
  const cover = facility.photos[0];

  return (
    <Link
      href={`/einrichtung/${facility.slug}`}
      className="relative block overflow-hidden rounded-brand-lg border border-brand-border bg-brand-surface shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full bg-brand-background">
        {cover ? (
          <Image
            src={cover.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-text-muted">
            <span aria-hidden="true" className="text-3xl">
              🏠
            </span>
          </div>
        )}
        <FavoriteButton
          facilityId={facility.id}
          initialFavorited={initialFavorited}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-brand-full border border-brand-border bg-brand-surface text-lg shadow-sm transition hover:bg-brand-background"
        />
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-brand-primary-dark">
          {facility.name}
        </h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          {facility.city}, {facility.state}
          {facility.distanceKm != null && ` · ${formatDistanceKm(facility.distanceKm)} entfernt`}
        </p>
        <p className="mt-3 line-clamp-2 text-sm text-brand-text">
          {facility.description}
        </p>
        <p className="mt-2 text-sm font-medium text-brand-text">
          {(() => {
            const price = cheapestCapacityPrice(facility);
            return price !== null ? `ab ${formatPriceEuro(price)}/Monat` : "Preis auf Anfrage";
          })()}
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
      </div>
    </Link>
  );
}
