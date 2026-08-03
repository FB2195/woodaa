"use client";

import type { FacilityWithCapacities } from "@woodaa/api";
import { useState } from "react";
import { FacilityCard } from "@/components/FacilityCard";
import { FacilityMap } from "@/components/FacilityMap";

export function SearchResultsView({ facilities }: { facilities: FacilityWithCapacities[] }) {
  const [view, setView] = useState<"list" | "map">("list");

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
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>
      ) : (
        <FacilityMap facilities={facilities} />
      )}
    </div>
  );
}
