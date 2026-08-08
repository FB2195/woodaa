"use client";

import type { FacilityCompareItem } from "@woodaa/api";
import Image from "next/image";
import Link from "next/link";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { useCompareList } from "@/lib/compare";
import { formatPriceEuro } from "@/lib/format";
import { cheapestCapacityPrice } from "@/lib/price";
import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";

// Grid layout: one fixed "row label" column + one column per facility -
// same table for every attribute row, so column widths stay aligned instead
// of each row laying out independently. gridTemplateColumns is computed
// from facilities.length (max 3, enforced by facility.byIds and the
// /vergleichen page) rather than hardcoded, so 1-3 selected facilities all
// render sensibly.
function gridStyle(count: number): React.CSSProperties {
  return { gridTemplateColumns: `minmax(140px,180px) repeat(${count}, minmax(200px, 1fr))` };
}

function Row({
  label,
  facilities,
  columns,
  render,
}: {
  label: string;
  facilities: FacilityCompareItem[];
  render: (facility: FacilityCompareItem) => React.ReactNode;
  columns: number;
}) {
  return (
    <div className="grid border-t border-brand-border" style={gridStyle(columns)}>
      <div className="p-4 text-sm font-medium text-brand-text-muted">{label}</div>
      {facilities.map((facility) => (
        <div key={facility.id} className="p-4 text-sm text-brand-text">
          {render(facility)}
        </div>
      ))}
    </div>
  );
}

function suitabilityLabel(facility: FacilityCompareItem): string {
  if (facility.minPflegegrad === null && facility.maxPflegegrad === null) {
    return "Nicht angegeben";
  }
  if (facility.minPflegegrad !== null && facility.maxPflegegrad !== null) {
    return `Pflegegrad ${facility.minPflegegrad}–${facility.maxPflegegrad}`;
  }
  return `Ab Pflegegrad ${facility.minPflegegrad ?? facility.maxPflegegrad}`;
}

export function CompareView({ facilities }: { facilities: FacilityCompareItem[] }) {
  const { remove } = useCompareList();
  const columns = facilities.length;

  return (
    <div className="mt-6 overflow-x-auto rounded-brand-lg border border-brand-border bg-brand-surface">
      <div className="grid" style={gridStyle(columns)}>
        <div />
        {facilities.map((facility) => {
          const cover = facility.photos[0];
          return (
            <div key={facility.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/einrichtung/${facility.slug}`}
                  className="font-semibold text-brand-heading hover:underline"
                >
                  {facility.name}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(facility.id)}
                  aria-label={`${facility.name} aus dem Vergleich entfernen`}
                  className="text-brand-text-muted hover:text-red-600"
                >
                  ✕
                </button>
              </div>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-brand-md bg-brand-background">
                {cover?.url ? (
                  <Image src={cover.url} alt="" fill sizes="220px" className="object-cover" />
                ) : (
                  <PlaceholderPhoto
                    category={cover?.category}
                    seed={cover?.id ?? facility.id}
                    className="h-full w-full"
                  />
                )}
              </div>
              <p className="text-sm text-brand-text-muted">
                {facility.city}, {facility.state}
              </p>
            </div>
          );
        })}
      </div>

      <Row
        label="Bewertung"
        facilities={facilities}
        columns={columns}
        render={(f) =>
          f.reviewCount > 0 ? (
            <span>
              <span aria-hidden="true">⭐</span>{" "}
              {f.avgRating!.toLocaleString("de-DE", { maximumFractionDigits: 1 })} ({f.reviewCount})
            </span>
          ) : (
            <span className="text-brand-text-muted">Noch keine Bewertungen</span>
          )
        }
      />

      <Row
        label="Pflegegrad-Eignung"
        facilities={facilities}
        columns={columns}
        render={(f) => suitabilityLabel(f)}
      />

      <Row
        label="Preis ab"
        facilities={facilities}
        columns={columns}
        render={(f) => {
          const price = cheapestCapacityPrice(f);
          return price !== null ? `${formatPriceEuro(price)}/Monat` : "Preis auf Anfrage";
        }}
      />

      <Row
        label="Verfügbarkeit"
        facilities={facilities}
        columns={columns}
        render={(f) => (
          <ul className="flex flex-col gap-1">
            {f.capacities.map((capacity) => (
              <li key={capacity.id}>
                {bookingTypeLabels[capacity.bookingType]}:{" "}
                {capacity.availableSlots > 0 ? (
                  <span className="text-brand-accent">{capacity.availableSlots} frei</span>
                ) : (
                  <span className="text-brand-text-muted">belegt</span>
                )}
              </li>
            ))}
          </ul>
        )}
      />

      <Row
        label="Ausstattung"
        facilities={facilities}
        columns={columns}
        render={(f) =>
          f.amenities.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {f.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-brand-full border border-brand-border px-2 py-0.5 text-xs text-brand-text-muted"
                >
                  {amenity}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-brand-text-muted">Keine Angaben</span>
          )
        }
      />
    </div>
  );
}
