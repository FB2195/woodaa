"use client";

import type { ChangeEvent } from "react";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { sortOptions } from "@/lib/sortLabels";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";

const radiusOptions = [
  { value: 10, label: "10 km Umkreis" },
  { value: 25, label: "25 km Umkreis" },
  { value: 50, label: "50 km Umkreis" },
  { value: 100, label: "100 km Umkreis" },
];

const selectClassName =
  "rounded-brand-md border border-brand-border px-4 py-3 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent";

// Re-submits the (single, native GET) form whenever a filter/sort control
// changes - every field in the same form is sent along, so this doesn't
// require re-typing the city, and it stays a plain full-page navigation
// rather than introducing a new client-side URL-manipulation pattern.
function submitOnChange(event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
  event.currentTarget.form?.requestSubmit();
}

export function SearchForm({
  defaultCity,
  defaultType,
  defaultMaxPrice,
  defaultRadiusKm,
  defaultPflegegrad,
  defaultSort,
  showFilters = false,
  showRadius = false,
  className,
}: {
  defaultCity?: string;
  defaultType?: string;
  defaultMaxPrice?: number;
  defaultRadiusKm?: number;
  defaultPflegegrad?: number;
  defaultSort?: string;
  showFilters?: boolean;
  // Just the radius selector, without the rest of showFilters' set
  // (price/Pflegegrad/sort) - for compact search boxes like the homepage
  // hero, where the full filter row would be too much.
  showRadius?: boolean;
  className?: string;
}) {
  return (
    <form
      action="/suche"
      method="GET"
      className={
        className ??
        "mx-auto flex max-w-2xl flex-col gap-3 rounded-brand-lg bg-brand-surface p-4 shadow-lg sm:flex-row"
      }
    >
      <LocationAutocomplete
        name="city"
        defaultValue={defaultCity}
        placeholder="Stadt oder PLZ, z. B. Berlin"
      />
      <select
        name="type"
        defaultValue={defaultType ?? ""}
        onChange={showFilters ? submitOnChange : undefined}
        className={selectClassName}
      >
        <option value="">Alle Pflegearten</option>
        {bookingTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {(showFilters || showRadius) && (
        <select
          name="radius"
          defaultValue={defaultRadiusKm ?? ""}
          onChange={showFilters ? submitOnChange : undefined}
          className={selectClassName}
        >
          <option value="">Beliebige Entfernung</option>
          {radiusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {showFilters && (
        <>
          <input
            type="number"
            name="maxPrice"
            min={0}
            step={50}
            defaultValue={defaultMaxPrice ?? ""}
            onChange={submitOnChange}
            placeholder="Max. Preis (€/Monat)"
            className={selectClassName}
          />

          <select
            name="pflegegrad"
            defaultValue={defaultPflegegrad ?? ""}
            onChange={submitOnChange}
            className={selectClassName}
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

          <select
            name="sort"
            defaultValue={defaultSort ?? "newest"}
            onChange={submitOnChange}
            className={selectClassName}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </>
      )}

      <button
        type="submit"
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
      >
        Suchen
      </button>
    </form>
  );
}
