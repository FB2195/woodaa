"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

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
  const containerRef = useRef<HTMLDivElement>(null);

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

  const showDropdown = open && debounced.trim().length >= 2 && (suggestions.data?.length ?? 0) > 0;

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
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
