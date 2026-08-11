"use client";

import { useState } from "react";
import { amenityIcon, sortByAmenityPriority } from "@/lib/amenityIcons";

const COLLAPSED_COUNT = 6;

export function FacilityAmenities({ amenities }: { amenities: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = sortByAmenityPriority(amenities);
  if (sorted.length === 0) return null;

  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-brand-text">Beliebteste Ausstattungen</h2>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {visible.map((amenity) => (
          <div key={amenity} className="flex items-center gap-3 text-sm text-brand-text">
            <span className="text-brand-text-muted">{amenityIcon(amenity)}</span>
            {amenity}
          </div>
        ))}
      </div>

      {sorted.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 text-sm font-semibold text-brand-accent underline"
        >
          {expanded ? "Weniger anzeigen" : "Alle Ausstattungsmerkmale anzeigen"}
        </button>
      )}
    </div>
  );
}
