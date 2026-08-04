import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let loaderPromise: Promise<typeof google.maps> | undefined;

// Lazy singleton, same pattern as lib/stripe.ts's getStripe() - the Google
// Maps JS SDK should only load once per page, on demand (not for every
// visitor, most of whom never open a map).
export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (!loaderPromise) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured"));
    }
    setOptions({ key: apiKey });
    // "marker" is needed too - google.maps.Marker lives in the
    // MarkerLibrary, not MapsLibrary, even though both end up merged onto
    // the global google.maps namespace once imported.
    loaderPromise = Promise.all([importLibrary("maps"), importLibrary("marker")]).then(
      () => google.maps,
    );
  }
  return loaderPromise;
}
