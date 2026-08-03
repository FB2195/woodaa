/**
 * Two separate concerns, two separate providers:
 *
 * - `geocodeAddress` (facility street address -> lat/lng for the map pin,
 *   fires rarely - once per facility create/address-change) stays on
 *   Nominatim (OpenStreetMap's free geocoder, no API key). Quality here
 *   was never the complaint and it isn't user-facing in real time.
 * - `searchLocations` (the search-box autocomplete dropdown, fires on
 *   every keystroke and IS directly user-facing) uses Google's Places
 *   Autocomplete API when `GOOGLE_PLACES_API_KEY` is configured - the
 *   free/community geocoder's suggestion quality was a real, reported
 *   problem (no fuzzy/typo matching, no structured city vs. postal-code
 *   results). Falls back to the Nominatim-based implementation when no
 *   key is set, so local dev works without a Google Cloud account.
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Woodaa/1.0 (+https://woodaa.de)";
const MIN_REQUEST_GAP_MS = 1100;

let lastRequestAt = 0;

async function throttledNominatimFetch(url: string): Promise<Response> {
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
    const res = await throttledNominatimFetch(url);
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
  placeId: string | null;
  label: string;
  city: string;
  postalCode: string | null;
  // Google's Autocomplete predictions don't include coordinates (that's a
  // separate, billed Place Details call we don't need for a plain
  // "fill the search box" suggestion) - null in that path, populated
  // when the Nominatim fallback is used.
  latitude: number | null;
  longitude: number | null;
};

const suggestionCache = new Map<string, { expires: number; value: LocationSuggestion[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

type GooglePlacePrediction = {
  placePrediction?: {
    placeId?: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
};

async function searchLocationsGoogle(
  query: string,
  apiKey: string,
): Promise<LocationSuggestion[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ["de"],
      includedPrimaryTypes: ["locality", "postal_code"],
      languageCode: "de",
    }),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { suggestions?: GooglePlacePrediction[] };
  return (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .map((p): LocationSuggestion | null => {
      const label = p.text?.text;
      const city = p.structuredFormat?.mainText?.text ?? label;
      if (!label || !city) return null;
      return {
        placeId: p.placeId ?? null,
        label,
        city,
        postalCode: null,
        latitude: null,
        longitude: null,
      };
    })
    .filter((s): s is LocationSuggestion => s !== null);
}

type NominatimResult = {
  lat: string;
  lon: string;
  address?: { city?: string; town?: string; village?: string; postcode?: string };
};

async function searchLocationsNominatim(query: string): Promise<LocationSuggestion[]> {
  const url = `${NOMINATIM_BASE}/search?format=json&countrycodes=de&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`;
  const res = await throttledNominatimFetch(url);
  if (!res.ok) return [];

  const results = (await res.json()) as NominatimResult[];
  const suggestions = results
    .map((r): LocationSuggestion | null => {
      const city = r.address?.city ?? r.address?.town ?? r.address?.village;
      if (!city) return null;
      const postalCode = r.address?.postcode ?? null;
      return {
        placeId: null,
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
  return suggestions.filter((s) => {
    const dedupeKey = `${s.city}-${s.postalCode}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const key = query.trim().toLowerCase();
  const cached = suggestionCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const results = apiKey
      ? await searchLocationsGoogle(query, apiKey)
      : await searchLocationsNominatim(query);

    suggestionCache.set(key, { expires: Date.now() + CACHE_TTL_MS, value: results });
    return results;
  } catch (err) {
    console.error("Location search failed:", err);
    return [];
  }
}
