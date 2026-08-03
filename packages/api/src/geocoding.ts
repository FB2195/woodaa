/**
 * Geocoding + location search via Nominatim (OpenStreetMap's free
 * geocoding service) — no API key, no signup, matches the "avoid a new
 * paid dependency where a free one exists" pattern already used for
 * Resend (plain fetch, no SDK). Nominatim's usage policy for the public
 * instance requires an identifying User-Agent and caps traffic at
 * roughly one request per second — both enforced below, since this
 * project isn't self-hosting an instance (yet).
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Woodaa/1.0 (+https://woodaa.de)";
const MIN_REQUEST_GAP_MS = 1100;

let lastRequestAt = 0;

async function throttledFetch(url: string): Promise<Response> {
  const wait = Math.max(0, MIN_REQUEST_GAP_MS - (Date.now() - lastRequestAt));
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
  return fetch(url, { headers: { "User-Agent": USER_AGENT } });
}

export type GeoPoint = { latitude: number; longitude: number };

// Best-effort: callers should never let a geocoding failure block the
// action that triggered it (creating/updating a facility) - a facility
// without coordinates just doesn't show up on the map.
export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  try {
    const url = `${NOMINATIM_BASE}/search?format=json&countrycodes=de&limit=1&q=${encodeURIComponent(address)}`;
    const res = await throttledFetch(url);
    if (!res.ok) return null;

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) return null;

    return { latitude: Number(first.lat), longitude: Number(first.lon) };
  } catch (err) {
    console.error("Geocoding failed:", err);
    return null;
  }
}

export type LocationSuggestion = {
  label: string;
  city: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  lat: string;
  lon: string;
  address?: { city?: string; town?: string; village?: string; postcode?: string };
};

const suggestionCache = new Map<string, { expires: number; value: LocationSuggestion[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const key = query.trim().toLowerCase();
  const cached = suggestionCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  try {
    const url = `${NOMINATIM_BASE}/search?format=json&countrycodes=de&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`;
    const res = await throttledFetch(url);
    if (!res.ok) return [];

    const results = (await res.json()) as NominatimResult[];
    const suggestions = results
      .map((r): LocationSuggestion | null => {
        const city = r.address?.city ?? r.address?.town ?? r.address?.village;
        if (!city) return null;
        const postalCode = r.address?.postcode ?? null;
        return {
          label: postalCode ? `${city} (${postalCode})` : city,
          city,
          postalCode,
          latitude: Number(r.lat),
          longitude: Number(r.lon),
        };
      })
      .filter((s): s is LocationSuggestion => s !== null);

    // Nominatim often returns multiple hits for the same place (different
    // OSM feature types) - keep only the first per city+postalCode.
    const seen = new Set<string>();
    const deduped = suggestions.filter((s) => {
      const dedupeKey = `${s.city}-${s.postalCode}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });

    suggestionCache.set(key, { expires: Date.now() + CACHE_TTL_MS, value: deduped });
    return deduped;
  } catch (err) {
    console.error("Location search failed:", err);
    return [];
  }
}
