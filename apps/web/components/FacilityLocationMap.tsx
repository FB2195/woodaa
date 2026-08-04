"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

export function FacilityLocationMap({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const position = { lat: latitude, lng: longitude };
        const map = new maps.Map(containerRef.current, {
          center: position,
          zoom: 14,
          streetViewControl: false,
          mapTypeControl: false,
        });
        new maps.Marker({ position, map, title: name });
      })
      .catch((err) => {
        console.error("Google Maps konnte nicht geladen werden", err);
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, name]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Standort von ${name} auf der Karte`}
      className="mt-4 h-64 w-full rounded-brand-lg bg-brand-background"
    />
  );
}
