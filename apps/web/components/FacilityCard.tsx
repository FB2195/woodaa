import type { FacilityWithCapacities } from "@woodaa/api";
import type { Pflegegrad } from "@woodaa/validators";
import Image from "next/image";
import Link from "next/link";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { EigenanteilPreview } from "@/components/search/EigenanteilPreview";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";
import { formatDistanceKm, formatPriceEuro } from "@/lib/format";
import { cheapestCapacityPrice } from "@/lib/price";

// distanceKm/avgRating/reviewCount are only present when the search
// computed them (facility.list) - absent e.g. on /favoriten, which
// reuses this same card with plain FacilityWithCapacities.
type Facility = FacilityWithCapacities & {
  distanceKm?: number | null;
  avgRating?: number | null;
  reviewCount?: number;
};

export function FacilityCard({
  facility,
  initialFavorited = false,
  pflegegrad,
}: {
  facility: Facility;
  initialFavorited?: boolean;
  // Own Pflegegrad from the logged-in user's care profile - only passed
  // when known, so the Eigenanteil preview stays hidden for guests and for
  // users who haven't filled in their profile yet (see SearchResultsView).
  pflegegrad?: Pflegegrad;
}) {
  const cover = facility.photos[0];

  return (
    <div className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-surface shadow-sm transition hover:shadow-md">
      <Link href={`/einrichtung/${facility.slug}`} className="relative block">
        <div className="relative aspect-[16/10] w-full bg-brand-background">
          {cover?.url ? (
            <Image
              src={cover.url}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <PlaceholderPhoto
              category={cover?.category}
              seed={cover?.id ?? facility.id}
              className="h-full w-full"
            />
          )}
          <FavoriteButton
            facilityId={facility.id}
            initialFavorited={initialFavorited}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-brand-full border border-brand-border bg-brand-surface text-lg shadow-sm transition hover:bg-brand-background"
          />
        </div>

        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold text-brand-heading">
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
          {!!facility.reviewCount && (
            <p className="mt-1 flex items-center gap-1 text-sm text-brand-text-muted">
              <span aria-hidden="true">⭐</span>
              {facility.avgRating!.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
              <span>({facility.reviewCount})</span>
            </p>
          )}
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

      {pflegegrad !== undefined && (
        <div className="px-6 pb-6">
          <EigenanteilPreview capacities={facility.capacities} pflegegrad={pflegegrad} />
        </div>
      )}
    </div>
  );
}
