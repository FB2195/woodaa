"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

const GERMANY_CENTER = { lat: 51.1657, lng: 10.4515 };

type MapFacility = {
  id: string;
  slug: string;
  name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
};

export function FacilityMap({ facilities }: { facilities: MapFacility[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;

        const withCoords = facilities.filter(
          (f): f is MapFacility & { latitude: number; longitude: number } =>
            f.latitude !== null && f.longitude !== null,
        );

        const map = new maps.Map(containerRef.current, {
          center: withCoords[0]
            ? { lat: withCoords[0].latitude, lng: withCoords[0].longitude }
            : GERMANY_CENTER,
          zoom: withCoords.length > 0 ? 6 : 5,
          streetViewControl: false,
          mapTypeControl: false,
        });

        const infoWindow = new maps.InfoWindow();
        const bounds = new maps.LatLngBounds();

        withCoords.forEach((facility) => {
          const position = { lat: facility.latitude, lng: facility.longitude };
          const marker = new maps.Marker({ position, map, title: facility.name });
          marker.addListener("click", () => {
            infoWindow.setContent(
              `<a href="/einrichtung/${facility.slug}" style="font-weight:600;color:#3f5c3f">${facility.name}</a><br/><span style="color:#666">${facility.city}</span>`,
            );
            infoWindow.open({ map, anchor: marker });
          });
          bounds.extend(position);
        });

        if (withCoords.length > 1) {
          map.fitBounds(bounds, 60);
        }
      })
      .catch((err) => {
        console.error("Google Maps konnte nicht geladen werden", err);
      });

    return () => {
      cancelled = true;
    };
  }, [facilities]);

  return <div ref={containerRef} className="h-[500px] w-full rounded-brand-lg bg-brand-background" />;
}
