"use client";

import type { FacilityPhoto } from "@woodaa/api";
import { MAX_FACILITY_PHOTOS, MAX_PHOTO_BYTES } from "@woodaa/validators";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoManager({ photos }: { photos: FacilityPhoto[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const requestUpload = trpc.operator.requestPhotoUpload.useMutation();
  const confirmUpload = trpc.operator.confirmPhotoUpload.useMutation();
  const removePhoto = trpc.operator.removePhoto.useMutation();

  const atLimit = photos.length >= MAX_FACILITY_PHOTOS;

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Nur JPEG, PNG oder WebP erlaubt.");
      return;
    }

    setUploading(true);
    try {
      // Dynamic import - keeps the compression library out of the main
      // dashboard bundle for operators who never upload a photo.
      const { default: imageCompression } = await import(
        "browser-image-compression"
      );
      const compressed = await imageCompression(file, {
        maxSizeMB: MAX_PHOTO_BYTES / (1024 * 1024),
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      });

      if (compressed.size > MAX_PHOTO_BYTES) {
        setError("Datei ist auch nach Komprimierung zu groß (max. 5 MB).");
        return;
      }

      const { uploadUrl, key } = await requestUpload.mutateAsync({
        contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
      });

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: compressed,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) {
        throw new Error("Upload zu Cloudflare R2 fehlgeschlagen.");
      }

      await confirmUpload.mutateAsync({ key });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <h3 className="font-semibold text-brand-primary-dark">Fotos</h3>

      {photos.length === 0 ? (
        <p className="text-sm text-brand-text-muted">
          Noch keine Fotos hochgeladen. Das erste Foto wird als Titelbild
          verwendet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-brand-md border border-brand-border"
            >
              <Image
                src={photo.url}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
              />
              <button
                type="button"
                disabled={removePhoto.isPending}
                onClick={async () => {
                  setError(null);
                  try {
                    await removePhoto.mutateAsync({ id: photo.id });
                    router.refresh();
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Da ist etwas schiefgelaufen.",
                    );
                  }
                }}
                aria-label="Foto entfernen"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-brand-full bg-black/60 text-sm text-white opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          disabled={atLimit || uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="hidden"
          id="photo-upload-input"
        />
        <label
          htmlFor="photo-upload-input"
          className={`rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 ${
            atLimit || uploading ? "pointer-events-none opacity-50" : "cursor-pointer"
          }`}
        >
          {uploading ? "Wird hochgeladen…" : "Foto hinzufügen"}
        </label>
        {atLimit && (
          <span className="text-xs text-brand-text-muted">
            Maximal {MAX_FACILITY_PHOTOS} Fotos erreicht.
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
