"use client";

import type { FacilityListItem } from "@woodaa/api";
import type { BookingType, Pflegegrad } from "@woodaa/validators";
import { useState } from "react";
import { FacilityCard } from "@/components/FacilityCard";
import { FacilityMap } from "@/components/FacilityMap";
import { SearchToolbar } from "@/components/search/SearchToolbar";
import { trpc } from "@/lib/trpc";

export function SearchResultsView({
  facilities,
  bookingTypeCounts,
  amenityCounts,
}: {
  facilities: FacilityListItem[];
  bookingTypeCounts: Record<BookingType, number>;
  amenityCounts: Record<string, number>;
}) {
  const [view, setView] = useState<"list" | "map">("list");
  // Gracefully empty for logged-out visitors, same pattern as Header.tsx's
  // auth.me query - no error, just no favorites pre-filled.
  const favoriteIds = trpc.favorite.myFacilityIds.useQuery(undefined, { retry: false });
  const favoritedSet = new Set(favoriteIds.data ?? []);

  // Fetched once here (not per-card) to avoid an N+1 query across the
  // result grid. isSuccess distinguishes "guest/still loading" (undefined,
  // don't show the Eigenanteil preview at all) from "logged in but
  // Pflegegrad not set" (isSuccess true, pflegegrad null - render nothing
  // for now rather than guessing, profile.pflegegrad drives the estimate).
  const profile = trpc.careApplication.myCareProfile.useQuery(undefined, { retry: false });
  const pflegegrad =
    profile.isSuccess && profile.data.pflegegrad !== null
      ? (profile.data.pflegegrad as Pflegegrad)
      : undefined;

  return (
    <div className="mt-6">
      <SearchToolbar
        bookingTypeCounts={bookingTypeCounts}
        amenityCounts={amenityCounts}
        mapView={view === "map"}
        onToggleMap={() => setView((v) => (v === "map" ? "list" : "map"))}
      />

      <div className="mt-6">
        {facilities.length === 0 ? (
          <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-8 text-center text-brand-text-muted">
            Keine Einrichtungen gefunden. Versuche andere Filter.
          </p>
        ) : view === "list" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                initialFavorited={favoritedSet.has(facility.id)}
                pflegegrad={pflegegrad}
              />
            ))}
          </div>
        ) : (
          <FacilityMap facilities={facilities} />
        )}
      </div>
    </div>
  );
}
