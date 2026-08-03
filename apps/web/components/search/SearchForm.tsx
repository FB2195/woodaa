import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";

export function SearchForm({
  defaultCity,
  defaultType,
  className,
}: {
  defaultCity?: string;
  defaultType?: string;
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
        className="rounded-brand-md border border-brand-border px-4 py-3 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
      >
        <option value="">Alle Pflegearten</option>
        {bookingTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
      >
        Suchen
      </button>
    </form>
  );
}
