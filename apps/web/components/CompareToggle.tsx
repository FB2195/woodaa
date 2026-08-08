"use client";

import { useCompareList } from "@/lib/compare";

export function CompareToggle({
  facilityId,
  className,
}: {
  facilityId: string;
  className?: string;
}) {
  const { ids, toggle, max } = useCompareList();
  const selected = ids.includes(facilityId);
  const atMax = !selected && ids.length >= max;

  return (
    <button
      type="button"
      onClick={(event) => {
        // FacilityCard wraps this in a <Link>, same reasoning as
        // FavoriteButton - don't let the click trigger navigation too.
        event.preventDefault();
        event.stopPropagation();
        toggle(facilityId);
      }}
      disabled={atMax}
      aria-pressed={selected}
      aria-label={selected ? "Von Vergleichsliste entfernen" : "Zum Vergleich hinzufügen"}
      title={atMax ? `Du kannst maximal ${max} Einrichtungen vergleichen` : undefined}
      className={
        className ??
        `flex items-center gap-1 rounded-brand-full border px-3 py-1 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
          selected
            ? "border-brand-accent bg-brand-accent text-white"
            : "border-brand-border bg-brand-surface text-brand-text-muted hover:bg-brand-background"
        }`
      }
    >
      <span aria-hidden="true">{selected ? "✓" : "+"}</span>
      Vergleichen
    </button>
  );
}
