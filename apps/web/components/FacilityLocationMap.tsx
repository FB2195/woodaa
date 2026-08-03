"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

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
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [longitude, latitude],
      zoom: 13,
      interactive: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    new maplibregl.Marker({ color: "#3f5c3f" }).setLngLat([longitude, latitude]).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Standort von ${name} auf der Karte`}
      className="mt-4 h-64 w-full rounded-brand-lg"
    />
  );
}
