import type { SortOption } from "@woodaa/validators";

// Kept in sync with apps/web's sort dropdown copy.
export const sortLabels: Record<SortOption, string> = {
  newest: "Neueste zuerst",
  price_asc: "Preis aufsteigend",
  distance_asc: "Entfernung",
  availability_first: "Verfügbare zuerst",
};

export const sortOptions = (Object.keys(sortLabels) as SortOption[]).map((value) => ({
  value,
  label: sortLabels[value],
}));
