import type { SortOption } from "@woodaa/validators";

export const sortLabels: Record<SortOption, string> = {
  newest: "Neueste zuerst",
  price_asc: "Preis aufsteigend",
  distance_asc: "Entfernung (nächste zuerst)",
};

export const sortOptions = (Object.keys(sortLabels) as SortOption[]).map(
  (value) => ({ value, label: sortLabels[value] }),
);
