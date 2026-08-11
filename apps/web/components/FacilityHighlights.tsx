import { amenityIcon, sortByAmenityPriority } from "@/lib/amenityIcons";

// Small icon-chip row right under the gallery, showing the 4 most
// relevant amenities at a glance - same idea as Booking.com's "Highlights
// der Unterkunft" cards. The full list (with the "Beliebteste
// Ausstattungen" heading and an expand-to-see-all toggle) lives further
// down in FacilityAmenities; this is just the up-front teaser.
export function FacilityHighlights({ amenities }: { amenities: string[] }) {
  const top = sortByAmenityPriority(amenities).slice(0, 4);
  if (top.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-brand-text">Highlights der Unterkunft</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {top.map((amenity) => (
          <div
            key={amenity}
            className="flex flex-col items-center gap-2 rounded-brand-lg border border-brand-border px-3 py-4 text-center"
          >
            <span className="text-brand-accent">{amenityIcon(amenity)}</span>
            <span className="text-sm font-medium text-brand-text">{amenity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
