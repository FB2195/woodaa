"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AMENITY_OPTIONS } from "@/lib/amenityOptions";
import { trpc } from "@/lib/trpc";

// Always editable (unlike PublicListingPrompt's description, which is only
// shown once at first public-listing request) - operators should be able
// to update their Ausstattung anytime, e.g. right after setting up the
// facility, well before going public.
export function AmenitiesEditor({ amenities }: { amenities: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(amenities));
  const [customInput, setCustomInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const updateFacility = trpc.operator.updateFacility.useMutation();

  const custom = amenities.filter((a) => !(AMENITY_OPTIONS as readonly string[]).includes(a));

  async function save(next: Set<string>) {
    setError(null);
    try {
      await updateFacility.mutateAsync({ amenities: Array.from(next) });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div>
        <h3 className="font-semibold text-brand-primary-dark">Ausstattung</h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Erscheint als Schlagwörter auf eurer Einrichtungsseite - hilft Familien schnell zu
          sehen, was ihr zusätzlich bietet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {AMENITY_OPTIONS.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={selected.has(option)}
              onChange={(event) => {
                const next = new Set(selected);
                if (event.target.checked) next.add(option);
                else next.delete(option);
                setSelected(next);
                void save(next);
              }}
            />
            {option}
          </label>
        ))}
      </div>

      {custom.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {custom.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1 rounded-brand-full border border-brand-border px-3 py-1 text-xs text-brand-text"
            >
              {item}
              <button
                type="button"
                onClick={() => {
                  const next = new Set(selected);
                  next.delete(item);
                  setSelected(next);
                  void save(next);
                }}
                aria-label={`${item} entfernen`}
                className="text-brand-text-muted hover:text-red-600"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = customInput.trim();
          if (!value) return;
          const next = new Set(selected);
          next.add(value);
          setSelected(next);
          setCustomInput("");
          void save(next);
        }}
      >
        <input
          value={customInput}
          onChange={(event) => setCustomInput(event.target.value)}
          placeholder="Eigene Angabe hinzufügen…"
          className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <button
          type="submit"
          className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text hover:bg-brand-background"
        >
          Hinzufügen
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
