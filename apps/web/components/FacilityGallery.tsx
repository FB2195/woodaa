"use client";

import type { FacilityPhoto } from "@woodaa/api";
import Image from "next/image";
import { useState } from "react";
import { PlaceholderPhoto } from "./PlaceholderPhoto";

function GalleryTile({ photo, className }: { photo: FacilityPhoto; className: string }) {
  if (!photo.url) {
    return <PlaceholderPhoto category={photo.category} seed={photo.id} className={className} />;
  }
  return (
    <Image
      src={photo.url}
      alt=""
      fill
      sizes="200px"
      className={`object-cover transition hover:opacity-90 ${className}`}
    />
  );
}

export function FacilityGallery({ photos }: { photos: FacilityPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;
  const active = openIndex !== null ? photos[openIndex] : null;

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="relative aspect-square overflow-hidden rounded-brand-md border border-brand-border"
          >
            <GalleryTile photo={photo} className="absolute inset-0 h-full w-full" />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            aria-label="Schließen"
            onClick={() => setOpenIndex(null)}
            className="absolute right-6 top-6 text-3xl text-white"
          >
            ✕
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              aria-label="Vorheriges Foto"
              onClick={(event) => {
                event.stopPropagation();
                setOpenIndex((i) => (i! - 1 + photos.length) % photos.length);
              }}
              className="absolute left-4 text-4xl text-white"
            >
              ‹
            </button>
          )}

          <div
            className="relative h-[80vh] w-full max-w-4xl overflow-hidden rounded-brand-lg"
            onClick={(event) => event.stopPropagation()}
          >
            {active.url ? (
              <Image src={active.url} alt="" fill sizes="90vw" className="object-contain" />
            ) : (
              <PlaceholderPhoto
                category={active.category}
                seed={active.id}
                showLabel
                className="h-full w-full"
              />
            )}
          </div>

          {photos.length > 1 && (
            <button
              type="button"
              aria-label="Nächstes Foto"
              onClick={(event) => {
                event.stopPropagation();
                setOpenIndex((i) => (i! + 1) % photos.length);
              }}
              className="absolute right-4 text-4xl text-white"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
