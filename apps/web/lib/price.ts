import type { FacilityWithCapacities } from "@woodaa/api";

// Cheapest priced capacity across all booking types a facility offers - used
// for the "ab X €/Monat" line on the search-result card. Returns null when
// no capacity has a price yet ("Preis auf Anfrage").
export function cheapestCapacityPrice(
  facility: Pick<FacilityWithCapacities, "capacities">,
): number | null {
  const priced = facility.capacities
    .map((c) => c.monthlyPriceCents)
    .filter((p): p is number => p !== null && p !== undefined);
  return priced.length ? Math.min(...priced) : null;
}
