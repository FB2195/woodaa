"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

export function LocationAutocomplete({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [debounced, setDebounced] = useState(value);
  const [open, setOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "error">("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(id);
  }, [value]);

  const suggestions = trpc.facility.searchLocations.useQuery(
    { query: debounced },
    { enabled: debounced.trim().length >= 2 },
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { city } = await utils.facility.reverseGeocode.fetch({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          if (!city) {
            setGeoStatus("error");
            return;
          }
          // Just fills the field, same as picking a suggestion from the
          // list below (see the plain suggestion onClick) - it doesn't
          // submit the form. Submitting immediately used to skip past
          // every other filter (Pflegeart, Preis, Radius, ...) the user
          // hadn't gotten a chance to set yet.
          setValue(city);
          setOpen(false);
          setGeoStatus("idle");
        } catch {
          setGeoStatus("error");
        }
      },
      () => setGeoStatus("error"),
      { timeout: 10_000 },
    );
  }

  const showSuggestions =
    open && debounced.trim().length >= 2 && (suggestions.data?.length ?? 0) > 0;
  const showLocateOption = open && value.trim().length === 0;
  const showDropdown = showSuggestions || showLocateOption;

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-brand-md border border-brand-border px-4 py-3 text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
      {showDropdown && (
        <ul className="absolute z-10 mt-1 w-full rounded-brand-md border border-brand-border bg-brand-surface shadow-lg">
          {showLocateOption && (
            <li>
              <button
                type="button"
                onClick={() => void useMyLocation()}
                disabled={geoStatus === "loading"}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-brand-accent hover:bg-brand-background disabled:opacity-60"
              >
                <LocateIcon />
                {geoStatus === "loading" ? "Standort wird ermittelt…" : "In deiner Nähe suchen"}
              </button>
              {geoStatus === "error" && (
                <p className="px-4 pb-2 text-xs text-red-600">
                  Standort konnte nicht ermittelt werden. Bitte Stadt eingeben.
                </p>
              )}
            </li>
          )}
          {suggestions.data?.map((suggestion) => (
            <li key={suggestion.placeId ?? `${suggestion.city}-${suggestion.postalCode}`}>
              <button
                type="button"
                onClick={() => {
                  setValue(suggestion.city);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-brand-text hover:bg-brand-background"
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
