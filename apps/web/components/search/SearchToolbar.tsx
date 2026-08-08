"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AMENITY_OPTIONS, type BookingType } from "@woodaa/validators";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { SaveSearchButton } from "@/components/search/SaveSearchButton";
import { sortLabels, sortOptions } from "@/lib/sortLabels";

function SortIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l3 3m-3-3l-3 3"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 20l-6-2V4l6 2m0 14l6-2m-6 2V6m6 12l6 2V6l-6-2m0 16V4m0 2L9 4"
      />
    </svg>
  );
}

const toolbarButtonClass =
  "flex items-center gap-1.5 rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-surface";
const toolbarButtonActiveClass =
  "border-brand-accent bg-brand-accent text-white hover:bg-brand-accent";

export function SearchToolbar({
  bookingTypeCounts,
  amenityCounts,
  mapView,
  onToggleMap,
}: {
  bookingTypeCounts: Record<BookingType, number>;
  amenityCounts: Record<string, number>;
  mapView: boolean;
  onToggleMap: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openPanel, setOpenPanel] = useState<"sort" | "filter" | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function navigate(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`/suche?${params.toString()}`);
  }

  function setParam(key: string, value: string | undefined) {
    navigate((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  function toggleAmenity(amenity: string) {
    navigate((params) => {
      const current = params.getAll("amenities");
      const next = current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity];
      params.delete("amenities");
      next.forEach((a) => params.append("amenities", a));
    });
  }

  const currentSort = searchParams.get("sort") ?? "newest";
  const currentType = searchParams.get("type") ?? "";
  const currentAmenities = searchParams.getAll("amenities");
  const activeFilterCount =
    (searchParams.get("maxPrice") ? 1 : 0) + (searchParams.get("pflegegrad") ? 1 : 0);

  return (
    <div>
      <div ref={panelRef} className="relative flex flex-wrap gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPanel(openPanel === "sort" ? null : "sort")}
            className={`${toolbarButtonClass} ${openPanel === "sort" ? "border-brand-accent" : ""}`}
          >
            <SortIcon />
            Sortieren
          </button>
          {openPanel === "sort" && (
            <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-brand-lg border border-brand-border bg-brand-surface p-2 shadow-lg">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setParam("sort", option.value === "newest" ? undefined : option.value);
                    setOpenPanel(null);
                  }}
                  className={`block w-full rounded-brand-md px-3 py-2 text-left text-sm ${
                    currentSort === option.value
                      ? "bg-brand-accent text-white"
                      : "text-brand-text hover:bg-brand-background"
                  }`}
                >
                  {sortLabels[option.value]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPanel(openPanel === "filter" ? null : "filter")}
            className={`${toolbarButtonClass} ${openPanel === "filter" ? "border-brand-accent" : ""}`}
          >
            <FilterIcon />
            Filtern{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          {openPanel === "filter" && (
            <form
              className="absolute left-0 top-full z-20 mt-2 w-72 flex flex-col gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 shadow-lg"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                navigate((params) => {
                  const maxPrice = String(form.get("maxPrice") ?? "").trim();
                  const pflegegrad = String(form.get("pflegegrad") ?? "").trim();
                  const radius = String(form.get("radius") ?? "").trim();
                  if (maxPrice) params.set("maxPrice", maxPrice);
                  else params.delete("maxPrice");
                  if (pflegegrad) params.set("pflegegrad", pflegegrad);
                  else params.delete("pflegegrad");
                  if (radius) params.set("radius", radius);
                  else params.delete("radius");
                });
                setOpenPanel(null);
              }}
            >
              <label className="flex flex-col gap-1 text-sm text-brand-text">
                Max. Preis (€/Monat)
                <input
                  type="number"
                  name="maxPrice"
                  min={0}
                  step={50}
                  defaultValue={searchParams.get("maxPrice") ?? ""}
                  className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-brand-text">
                Pflegegrad
                <select
                  name="pflegegrad"
                  defaultValue={searchParams.get("pflegegrad") ?? ""}
                  className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="">Jeder Pflegegrad</option>
                  {pflegegradOptions
                    .filter((option) => option.value > 0)
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-brand-text">
                Umkreis
                <select
                  name="radius"
                  defaultValue={searchParams.get("radius") ?? ""}
                  className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="">Beliebige Entfernung</option>
                  <option value="10">10 km Umkreis</option>
                  <option value="25">25 km Umkreis</option>
                  <option value="50">50 km Umkreis</option>
                  <option value="100">100 km Umkreis</option>
                </select>
              </label>
              <button
                type="submit"
                className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Anwenden
              </button>
            </form>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleMap}
          className={`${toolbarButtonClass} ${mapView ? toolbarButtonActiveClass : ""}`}
        >
          <MapIcon />
          Karte
        </button>

        <SaveSearchButton />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {bookingTypeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              setParam("type", currentType === option.value ? undefined : option.value)
            }
            className={`shrink-0 rounded-brand-full border px-4 py-2 text-sm font-medium transition ${
              currentType === option.value
                ? "border-brand-accent bg-brand-accent text-white"
                : "border-brand-border bg-brand-surface text-brand-text hover:bg-brand-background"
            }`}
          >
            {option.label} ({bookingTypeCounts[option.value] ?? 0})
          </button>
        ))}
        {AMENITY_OPTIONS.map((amenity) => (
          <button
            key={amenity}
            type="button"
            onClick={() => toggleAmenity(amenity)}
            className={`shrink-0 rounded-brand-full border px-4 py-2 text-sm font-medium transition ${
              currentAmenities.includes(amenity)
                ? "border-brand-accent bg-brand-accent text-white"
                : "border-brand-border bg-brand-surface text-brand-text hover:bg-brand-background"
            }`}
          >
            {amenity} ({amenityCounts[amenity] ?? 0})
          </button>
        ))}
      </div>
    </div>
  );
}
