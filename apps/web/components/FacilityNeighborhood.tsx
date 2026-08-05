"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { NearbyPlace } from "@woodaa/api";

function ShoppingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 12H7L6 8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function HealthcareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function TransportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="5" width="16" height="12" rx="2" />
      <path strokeLinecap="round" d="M4 13h16M8 21l1.5-4M16 21l-1.5-4" />
      <circle cx="8" cy="9" r="0.5" fill="currentColor" />
      <circle cx="16" cy="9" r="0.5" fill="currentColor" />
    </svg>
  );
}

const tabs = [
  { key: "shopping", label: "Einkaufsmöglichkeiten", icon: ShoppingIcon },
  { key: "healthcare", label: "Ärzte & Krankenhäuser", icon: HealthcareIcon },
  { key: "transport", label: "Transport", icon: TransportIcon },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function PlaceRow({ place }: { place: NearbyPlace }) {
  return (
    <li className="flex items-center justify-between border-b border-brand-border py-2 text-sm last:border-0">
      <span className="text-brand-text">{place.name}</span>
      <span className="shrink-0 text-brand-text-muted">
        {place.walkMinutes} Min. ({place.distanceMeters} m)
      </span>
    </li>
  );
}

export function FacilityNeighborhood({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("shopping");
  const hasLocation = latitude !== null && longitude !== null;

  const nearby = trpc.facility.nearbyPlaces.useQuery(
    { latitude: latitude ?? 0, longitude: longitude ?? 0 },
    { enabled: hasLocation },
  );

  if (!hasLocation) return null;

  const places = nearby.data?.[activeTab] ?? [];

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-brand-text">Umgebung der Unterkunft</h2>

      <div className="mt-3 flex gap-2 border-b border-brand-border">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeTab === key
                ? "border-brand-accent text-brand-accent"
                : "border-transparent text-brand-text-muted hover:text-brand-text"
            }`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {nearby.isLoading ? (
          <p className="text-sm text-brand-text-muted">Lädt…</p>
        ) : places.length === 0 ? (
          <p className="text-sm text-brand-text-muted">
            Keine Einträge in der Nähe gefunden.
          </p>
        ) : (
          <ul>
            {places.map((place, i) => (
              <PlaceRow key={`${place.name}-${i}`} place={place} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
