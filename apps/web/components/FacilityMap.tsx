"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const GERMANY_CENTER: [number, number] = [10.4515, 51.1657];

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
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const withCoords = facilities.filter(
      (f): f is MapFacility & { latitude: number; longitude: number } =>
        f.latitude !== null && f.longitude !== null,
    );

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: withCoords[0]
        ? [withCoords[0].longitude, withCoords[0].latitude]
        : GERMANY_CENTER,
      zoom: withCoords.length > 0 ? 6 : 5,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const bounds = new maplibregl.LngLatBounds();
    withCoords.forEach((facility) => {
      const popup = new maplibregl.Popup({ offset: 24 }).setHTML(
        `<a href="/einrichtung/${facility.slug}" style="font-weight:600;color:#3f5c3f">${facility.name}</a><br/><span style="color:#666">${facility.city}</span>`,
      );
      new maplibregl.Marker({ color: "#3f5c3f" })
        .setLngLat([facility.longitude, facility.latitude])
        .setPopup(popup)
        .addTo(map);
      bounds.extend([facility.longitude, facility.latitude]);
    });

    if (withCoords.length > 1) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [facilities]);

  return <div ref={containerRef} className="h-[500px] w-full rounded-brand-lg" />;
}
