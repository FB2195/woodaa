"use client";

import type { FacilityListItem } from "@woodaa/api";
import { useState } from "react";
import { FacilityCard } from "@/components/FacilityCard";
import { FacilityMap } from "@/components/FacilityMap";
import { trpc } from "@/lib/trpc";

export function SearchResultsView({ facilities }: { facilities: FacilityListItem[] }) {
  const [view, setView] = useState<"list" | "map">("list");
  // Gracefully empty for logged-out visitors, same pattern as Header.tsx's
  // auth.me query - no error, just no favorites pre-filled.
  const favoriteIds = trpc.favorite.myFacilityIds.useQuery(undefined, { retry: false });
  const favoritedSet = new Set(favoriteIds.data ?? []);

  return (
    <div className="mt-8">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-brand-md border px-4 py-2 text-sm font-semibold transition ${
            view === "list"
              ? "border-brand-accent bg-brand-accent text-white"
              : "border-brand-border text-brand-text hover:bg-brand-background"
          }`}
        >
          Liste
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

      {view === "list" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              initialFavorited={favoritedSet.has(facility.id)}
            />
          ))}
        </div>
      ) : (
        <FacilityMap facilities={facilities} />
      )}
    </div>
  );
}
