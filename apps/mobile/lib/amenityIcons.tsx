import { AMENITY_OPTIONS } from "@woodaa/validators";

// RN port of apps/web/lib/amenityIcons.tsx - web uses hand-drawn SVGs, this
// uses emoji glyphs instead (same convention as components/account/icons.tsx)
// to avoid a react-native-svg dependency.
const ICONS: Partial<Record<(typeof AMENITY_OPTIONS)[number], string>> = {
  Einzelzimmer: "🛏️",
  Doppelzimmer: "🛏️",
  "Balkon/Terrasse im Zimmer": "🌇",
  "TV im Zimmer": "📺",
  "WLAN im Zimmer": "📶",
  Barrierefreiheit: "♿",
  Garten: "🌳",
  Cafeteria: "☕",
  "Haustiere erlaubt": "🐾",
  Ergotherapie: "🤲",
  Physiotherapie: "🤲",
  "Eigene Küche/Vollverpflegung": "🍽️",
  Wäscheservice: "🧺",
  Notrufsystem: "🆘",
};

export function amenityIcon(amenity: string): string {
  return ICONS[amenity as (typeof AMENITY_OPTIONS)[number]] ?? "✓";
}

// Same priority list as web's AMENITY_PRIORITY - keep in sync if that one
// changes, so "Highlights der Unterkunft" and the collapsed "Beliebteste
// Ausstattungen" view show the same subset on both platforms.
export const AMENITY_PRIORITY: readonly string[] = [
  "Barrierefreiheit",
  "WLAN im Zimmer",
  "Eigene Küche/Vollverpflegung",
  "Garten",
  "Einzelzimmer",
  "Demenzbetreuung",
  "Palliativpflege",
  "Physiotherapie",
  "Ergotherapie",
  "Notrufsystem",
  "Haustiere erlaubt",
  "Cafeteria",
  ...AMENITY_OPTIONS,
];

export function sortByAmenityPriority(amenities: string[]): string[] {
  return [...amenities].sort(
    (a, b) => AMENITY_PRIORITY.indexOf(a) - AMENITY_PRIORITY.indexOf(b),
  );
}
