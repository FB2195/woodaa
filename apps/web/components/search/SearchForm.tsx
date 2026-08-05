"use client";

import { useState, type ChangeEvent } from "react";
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

const weekdayOptions = [
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
  { value: 7, label: "So" },
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
  defaultAvailableFromDate,
  defaultRangeStart,
  defaultRangeEnd,
  defaultWeekdays,
  defaultHoursPerDay,
  defaultOnlyAvailable = true,
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
  defaultAvailableFromDate?: string;
  defaultRangeStart?: string;
  defaultRangeEnd?: string;
  defaultWeekdays?: number[];
  defaultHoursPerDay?: number;
  defaultOnlyAvailable?: boolean;
  showFilters?: boolean;
  // Just the radius selector, without the rest of showFilters' set
  // (price/Pflegegrad/sort) - for compact search boxes like the homepage
  // hero, where the full filter row would be too much.
  showRadius?: boolean;
  className?: string;
}) {
  // type drives which date/time fields below show ("je nachdem was man
  // anklickt öffnet sich die Option") - doesn't itself auto-submit, same as
  // before, the fields just fill in ahead of the "Suchen" click.
  const [type, setType] = useState(defaultType ?? "");
  const [weekdays, setWeekdays] = useState<number[]>(defaultWeekdays ?? []);
  // Plain HTML checkboxes submit nothing at all when unchecked, so
  // "unticking" this would silently vanish from the URL instead of
  // communicating false - tracked as state and always submitted via the
  // hidden input below instead, so the box's off-state actually reaches
  // the server.
  const [onlyAvailable, setOnlyAvailable] = useState(defaultOnlyAvailable);

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
    );
  }

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
        value={type}
        onChange={(event) => {
          setType(event.target.value);
          if (showFilters) submitOnChange(event);
        }}
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

      {type === "STATIONAERE_AUFNAHME" && (
        <label className="flex flex-col gap-1 text-sm text-brand-text-muted">
          Verfügbar ab
          <input
            type="date"
            name="availableFromDate"
            defaultValue={defaultAvailableFromDate}
            className={selectClassName}
          />
        </label>
      )}

      {type === "KURZZEITPFLEGE" && (
        <>
          <label className="flex flex-col gap-1 text-sm text-brand-text-muted">
            Von
            <input
              type="date"
              name="rangeStart"
              defaultValue={defaultRangeStart}
              className={selectClassName}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-brand-text-muted">
            Bis
            <input
              type="date"
              name="rangeEnd"
              defaultValue={defaultRangeEnd}
              className={selectClassName}
            />
          </label>
        </>
      )}

      {(type === "TAGESPFLEGE" || type === "NACHTPFLEGE") && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {weekdayOptions.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleWeekday(day.value)}
                className={`rounded-brand-full border px-3 py-1.5 text-sm font-medium transition ${
                  weekdays.includes(day.value)
                    ? "border-brand-accent bg-brand-accent text-white"
                    : "border-brand-border text-brand-text hover:bg-brand-background"
                }`}
              >
                {day.label}
              </button>
            ))}
            {weekdays.map((day) => (
              <input key={day} type="hidden" name="weekdays" value={day} />
            ))}
          </div>
          <input
            type="number"
            name="hoursPerDay"
            min={1}
            max={24}
            defaultValue={defaultHoursPerDay ?? ""}
            placeholder="Stunden pro Tag"
            className={selectClassName}
          />
        </div>
      )}

      {type !== "" && (
        <label className="flex items-center gap-2 text-sm text-brand-text-muted">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(event) => setOnlyAvailable(event.target.checked)}
            className="h-4 w-4 accent-brand-accent"
          />
          Nur freie Pflegeplätze anzeigen
          <input type="hidden" name="onlyAvailable" value={onlyAvailable ? "true" : "false"} />
        </label>
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
