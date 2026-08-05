"use client";

import { useState } from "react";
import type { FacilityPhoto } from "@woodaa/api";
import { FacilityGallery } from "@/components/FacilityGallery";
import { FacilityLocationMap } from "@/components/FacilityLocationMap";

// Same Liste/Karte toggle pattern as SearchResultsView - the map used to
// render inline below the photo grid, always visible, which pushed the
// description/availability section down by a full map height even for
// visitors who only wanted photos.
export function FacilityGalleryAndMap({
  photos,
  latitude,
  longitude,
  name,
}: {
  photos: FacilityPhoto[];
  latitude: number | null;
  longitude: number | null;
  name: string;
}) {
  const [view, setView] = useState<"photos" | "map">("photos");
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className="mt-6">
      {hasLocation && (
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setView("photos")}
            className={`rounded-brand-md border px-4 py-2 text-sm font-semibold transition ${
              view === "photos"
                ? "border-brand-accent bg-brand-accent text-white"
                : "border-brand-border text-brand-text hover:bg-brand-background"
            }`}
          >
            Fotos
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`rounded-brand-md border px-4 py-2 text-sm font-semibold transition ${
              view === "map"
                ? "border-brand-accent bg-brand-accent text-white"
                : "border-brand-border text-brand-text hover:bg-brand-background"
            }`}
          >
            Karte
          </button>
        </div>
      )}

      {view === "photos" || !hasLocation ? (
        <FacilityGallery photos={photos} />
      ) : (
        <FacilityLocationMap latitude={latitude} longitude={longitude} name={name} />
      )}
    </div>
  );
}
