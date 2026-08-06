import type { GeoPoint } from "./geocoding";

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// A loose lat/lng rectangle around `origin`, generous enough to contain
// every point within `radiusKm` (and then some, near the corners) - meant
// as a cheap SQL-level candidate filter, with haversineDistanceKm doing the
// precise cut afterwards. 1 degree latitude is ~111km everywhere; 1 degree
// longitude shrinks by cos(latitude) as you move away from the equator.
export function boundingBoxForRadius(
  origin: GeoPoint,
  radiusKm: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDeltaDeg = radiusKm / 111;
  const lngDeltaDeg = radiusKm / (111 * Math.cos((origin.latitude * Math.PI) / 180));
  return {
    minLat: origin.latitude - latDeltaDeg,
    maxLat: origin.latitude + latDeltaDeg,
    minLng: origin.longitude - lngDeltaDeg,
    maxLng: origin.longitude + lngDeltaDeg,
  };
}
