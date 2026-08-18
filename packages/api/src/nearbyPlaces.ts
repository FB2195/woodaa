/**
 * "Umgebung der Unterkunft" - nearby shopping/healthcare/transport points of
 * interest for the facility detail page, in the spirit of Booking.com's
 * neighborhood section. Categories are chosen for a care-facility audience
 * rather than Booking's restaurants/cafes (visitors researching a Pflegeheim
 * care about the pharmacy and the bus stop, not the nearest bar) - sourced
 * from OpenStreetMap's Overpass API, free and keyless like the Nominatim
 * geocoding above, since this is a low-traffic, cacheable lookup rather than
 * a per-keystroke one.
 */

import { reportError } from "./errorReporting";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "woodaa/1.0 (+https://woodaa.de)";
// ~5 km/h, the walking-speed assumption booking sites' "X Min. (Y m)"
// distance labels are typically built on.
const WALK_METERS_PER_MINUTE = 80;

export type NearbyPlace = {
  name: string;
  distanceMeters: number;
  walkMinutes: number;
};

export type NearbyPlacesResult = {
  shopping: NearbyPlace[];
  healthcare: NearbyPlace[];
  transport: NearbyPlace[];
};

const EMPTY_RESULT: NearbyPlacesResult = { shopping: [], healthcare: [], transport: [] };

type OverpassElement = {
  lat: number;
  lon: number;
  tags?: Record<string, string>;
};

// Haversine - straight-line distance, not walking-route distance (no
// routing engine involved here), same simplification the "in deiner Nähe"
// radius search elsewhere in the app already makes.
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function toPlace(
  el: OverpassElement,
  originLat: number,
  originLon: number,
  fallbackName?: string,
): NearbyPlace | null {
  const name = el.tags?.name ?? fallbackName;
  if (!name) return null;
  const distanceMeters = Math.round(haversineMeters(originLat, originLon, el.lat, el.lon));
  return {
    name,
    distanceMeters,
    walkMinutes: Math.max(1, Math.ceil(distanceMeters / WALK_METERS_PER_MINUTE)),
  };
}

function topByDistance(places: NearbyPlace[], limit: number): NearbyPlace[] {
  // Same OSM node can appear more than once (e.g. a chain pharmacy mapped
  // as both an entrance and a building node) - keep the closest per name.
  const closestByName = new Map<string, NearbyPlace>();
  for (const place of places) {
    const existing = closestByName.get(place.name);
    if (!existing || place.distanceMeters < existing.distanceMeters) {
      closestByName.set(place.name, place);
    }
  }
  return [...closestByName.values()]
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

const cache = new Map<string, { expires: number; value: NearbyPlacesResult }>();
// POIs don't move day to day - cached far longer than the search-suggestion
// caches above, since this is one Overpass call per distinct facility
// location rather than per keystroke.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
): Promise<NearbyPlacesResult> {
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  const query = `[out:json][timeout:15];(
    node["shop"~"^(supermarket|bakery|convenience|greengrocer)$"](around:1500,${latitude},${longitude});
    node["amenity"~"^(doctors|hospital|pharmacy|clinic)$"](around:1500,${latitude},${longitude});
    node["highway"="bus_stop"](around:1000,${latitude},${longitude});
    node["railway"~"^(station|halt|tram_stop)$"](around:2000,${latitude},${longitude});
  );out body;`;

  try {
    // Overpass's public instance intermittently answers "server too busy"
    // under load - a single free-retry smooths that over instead of
    // showing visitors a wrongly-empty section (a real failure still falls
    // through to EMPTY_RESULT below, which - unlike a success - is
    // deliberately never cached, so the next page load tries again fresh).
    let res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
      });
    }
    if (!res.ok) return EMPTY_RESULT;

    const data = (await res.json()) as { elements?: OverpassElement[] };
    const shopping: NearbyPlace[] = [];
    const healthcare: NearbyPlace[] = [];
    const transport: NearbyPlace[] = [];

    for (const el of data.elements ?? []) {
      const tags = el.tags ?? {};
      let place: NearbyPlace | null = null;

      if (tags.shop) {
        place = toPlace(el, latitude, longitude);
        if (place) shopping.push(place);
      } else if (
        tags.amenity &&
        ["doctors", "hospital", "pharmacy", "clinic"].includes(tags.amenity)
      ) {
        place = toPlace(el, latitude, longitude);
        if (place) healthcare.push(place);
      } else if (tags.highway === "bus_stop") {
        place = toPlace(el, latitude, longitude, "Bushaltestelle");
        if (place) transport.push(place);
      } else if (tags.railway) {
        place = toPlace(el, latitude, longitude, "Bahnhaltepunkt");
        if (place) transport.push(place);
      }
    }

    const result: NearbyPlacesResult = {
      shopping: topByDistance(shopping, 6),
      healthcare: topByDistance(healthcare, 6),
      transport: topByDistance(transport, 6),
    };

    cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value: result });
    return result;
  } catch (err) {
    reportError(err, "Nearby places lookup failed", { latitude, longitude });
    return EMPTY_RESULT;
  }
}
