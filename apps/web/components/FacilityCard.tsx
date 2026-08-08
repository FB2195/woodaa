import type { FacilityWithCapacities } from "@woodaa/api";
import type { Pflegegrad } from "@woodaa/validators";
import Image from "next/image";
import Link from "next/link";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { EigenanteilPreview } from "@/components/search/EigenanteilPreview";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { formatDistanceKm, formatPriceEuro } from "@/lib/format";
import { cheapestCapacityPrice } from "@/lib/price";

// distanceKm/avgRating/reviewCount are only present when the search
// computed them (facility.list) - absent e.g. on /favoriten, which
// reuses this same card with plain FacilityWithCapacities. operatorPhone/
// operatorEmail omitted - neither search nor favorites exposes them to
// customers (see the comment on facility.bySlug).
type Facility = Omit<FacilityWithCapacities, "operatorPhone" | "operatorEmail"> & {
  distanceKm?: number | null;
  avgRating?: number | null;
  reviewCount?: number;
  // Set only when the search included a bookingType + matching date/time
  // filter and "Nur freie Pflegeplätze anzeigen" was unchecked - see
  // packages/api/src/searchAvailability.ts.
  isAvailableForRequest?: boolean | null;
  availabilityNote?: string | null;
  // Set by facility.list - the Pflegegrad-specific rate when a Pflegegrad
  // filter was given, else the same generic price cheapestCapacityPrice
  // would compute. undefined (not null) on call sites without search
  // context (e.g. /favoriten), which fall back to computing it locally.
  displayPriceCents?: number | null;
  // "Antwortet meist innerhalb von X Std." - null/undefined for
  // AUTOMATISCH facilities or without enough recent history, see
  // packages/api/src/responseTime.ts.
  responseTimeBadge?: string | null;
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
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-brand-heading">
              {facility.name}
            </h3>
            {facility.verifiedAt && <VerifiedBadge />}
          </div>
          <p className="mt-1 text-sm text-brand-text-muted">
            {facility.city}, {facility.state}
            {facility.distanceKm != null && ` · ${formatDistanceKm(facility.distanceKm)} entfernt`}
          </p>
          <p className="mt-3 line-clamp-2 text-sm text-brand-text">
            {facility.description}
          </p>
          <p className="mt-2 text-sm font-medium text-brand-text">
            {(() => {
              const price =
                facility.displayPriceCents !== undefined
                  ? facility.displayPriceCents
                  : cheapestCapacityPrice(facility);
              return price !== null ? `ab ${formatPriceEuro(price)}/Monat` : "Preis auf Anfrage";
            })()}
          </p>
          {facility.isAvailableForRequest === false && (
            <p className="mt-2 rounded-brand-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
              {facility.availabilityNote ?? "Aktuell ausgebucht"}
            </p>
          )}
          {!!facility.reviewCount && (
            <p className="mt-1 flex items-center gap-1 text-sm text-brand-text-muted">
              <span aria-hidden="true">⭐</span>
              {facility.avgRating!.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
              <span>({facility.reviewCount})</span>
            </p>
          )}
          {facility.responseTimeBadge && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-brand-full border border-brand-border px-3 py-1 text-xs font-medium text-brand-text-muted">
              <span aria-hidden="true">⏱</span>
              {facility.responseTimeBadge}
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
