// Same pattern as stripeConfig.ts: a public, client-safe key (Google Maps
// keys are restricted by app bundle ID / package name, not secret like an
// API secret) read from env, hardcoded into eas.json's env once known. Web
// uses NEXT_PUBLIC_GOOGLE_MAPS_API_KEY with a referrer-restricted key -
// mobile needs its own key restricted to the iOS/Android bundle IDs
// instead, since apps don't send an HTTP referrer. Until it's set, map
// components render nothing (see FacilityLocationMap/FacilityResultsMap).
export function googleMapsApiKey(): string | null {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? null;
}
