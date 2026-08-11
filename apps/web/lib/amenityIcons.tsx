// Small, self-contained stroke icons for facility amenities - same
// convention as components/account/icons.tsx (no icon library dependency).
// Not every one of AMENITY_OPTIONS gets a bespoke icon; the rest fall back
// to a generic check-circle rather than forcing a distinct glyph for
// every single option.

import type { ReactNode } from "react";
import { AMENITY_OPTIONS } from "@woodaa/validators";

function base(children: ReactNode) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
      {children}
    </svg>
  );
}

function BedIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v2M21 18v2M3 12V8a2 2 0 0 1 2-2h3v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 10h6a2 2 0 0 1 2 2v2" />
    </>,
  );
}

function BalconyIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16M4 10v10M20 10v10" />
      <path strokeLinecap="round" d="M8 10V6a4 4 0 0 1 8 0v4" />
    </>,
  );
}

function TvIcon() {
  return base(
    <>
      <rect x="3" y="5" width="18" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M9 20h6" />
    </>,
  );
}

function WifiIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 9c4.4-4 11.6-4 16 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12.5c2.8-2.4 7.2-2.4 10 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 16c1.2-1 2.8-1 4 0" />
      <circle cx="12" cy="19" r="0.9" fill="currentColor" stroke="none" />
    </>,
  );
}

function WheelchairIcon() {
  return base(
    <>
      <circle cx="9" cy="5" r="1.6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7v6l5 5M9 13h6M6 13a6 6 0 1 0 8 6" />
    </>,
  );
}

function GardenIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-7" />
      <path d="M12 14c-4 0-6-2.5-6-6 3.5 0 6 2 6 6Z" />
      <path d="M12 11c4 0 6-2.5 6-6-3.5 0-6 2-6 6Z" />
    </>,
  );
}

function CafeteriaIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path strokeLinecap="round" d="M8 4c0 1-1 1-1 2M12 4c0 1-1 1-1 2" />
    </>,
  );
}

function PetsIcon() {
  return base(
    <>
      <circle cx="7" cy="9" r="1.6" />
      <circle cx="12" cy="6.5" r="1.6" />
      <circle cx="17" cy="9" r="1.6" />
      <circle cx="9.5" cy="12" r="1.6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13c2 0 3.5 1.6 3.5 3.4 0 1.8-1.5 2.6-3.2 2.1-1-.3-1.7-.3-2.6 0-1.7.5-3.2-.3-3.2-2.1C9.5 14.6 11 13 13 13" />
    </>,
  );
}

function TherapyIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h3v6a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-3a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12h-3v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-3a1 1 0 0 0-1-1Z" />
    </>,
  );
}

function KitchenIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v8M4 3v3a2 2 0 0 0 4 0V3M6 11v10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3c-1.7 0-3 2-3 5s1.3 5 3 5v8" />
    </>,
  );
}

function LaundryIcon() {
  return base(
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="4.2" />
      <circle cx="12" cy="13" r="1.6" />
      <circle cx="7" cy="6" r="0.8" fill="currentColor" stroke="none" />
    </>,
  );
}

function AlarmIcon() {
  return base(
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2M5.6 6.6l1.4 1.4M18.4 6.6 17 8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 13a6 6 0 1 1 12 0c0 2.5 1 3.5 1 3.5H5S6 15.5 6 13Z" />
      <path strokeLinecap="round" d="M10 20a2 2 0 0 0 4 0" />
    </>,
  );
}

function CheckIcon() {
  return base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5l2.3 2.3L16 10" />
    </>,
  );
}

const ICONS: Partial<Record<(typeof AMENITY_OPTIONS)[number], () => ReactNode>> = {
  Einzelzimmer: BedIcon,
  Doppelzimmer: BedIcon,
  "Balkon/Terrasse im Zimmer": BalconyIcon,
  "TV im Zimmer": TvIcon,
  "WLAN im Zimmer": WifiIcon,
  Barrierefreiheit: WheelchairIcon,
  Garten: GardenIcon,
  Cafeteria: CafeteriaIcon,
  "Haustiere erlaubt": PetsIcon,
  Ergotherapie: TherapyIcon,
  Physiotherapie: TherapyIcon,
  "Eigene Küche/Vollverpflegung": KitchenIcon,
  Wäscheservice: LaundryIcon,
  Notrufsystem: AlarmIcon,
};

export function amenityIcon(amenity: string) {
  const Icon = ICONS[amenity as (typeof AMENITY_OPTIONS)[number]];
  return Icon ? Icon() : CheckIcon();
}

// Order facility.amenities (a free-order string[]) should be presented in -
// most broadly relevant first, so "Highlights der Unterkunft" and the
// default (collapsed) view of "Beliebteste Ausstattungen" show the same,
// predictable subset regardless of the order an operator happened to
// check the boxes in.
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
