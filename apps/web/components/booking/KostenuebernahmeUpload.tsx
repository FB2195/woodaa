"use client";

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

export function KostenuebernahmeUpload({ bookingId }: { bookingId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const requestUpload = trpc.booking.requestKostenuebernahmeUpload.useMutation();
  const confirmUpload = trpc.booking.confirmKostenuebernahmeUpload.useMutation();

  async function handleFile(file: File) {
    setError(null);
    if (file.type !== "application/pdf") {
      setError("Bitte lade die Bestätigung als PDF hoch.");
      return;
    }

    setUploading(true);
    try {
      const { uploadUrl, key } = await requestUpload.mutateAsync({ bookingId });
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      });
      if (!putRes.ok) {
        throw new Error("Upload fehlgeschlagen.");
      }
      await confirmUpload.mutateAsync({ bookingId, key });
      setUploaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (uploaded) {
    return (
      <p className="mt-3 text-sm text-brand-accent">
        Kostenübernahmebestätigung hochgeladen - die Einrichtung prüft sie und gibt die
        Buchung frei.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-brand-md bg-brand-background p-3">
      <p className="text-sm text-brand-text">
        Bitte lade die Kostenübernahmebestätigung deiner Pflegekasse hoch, damit die
        Einrichtung die Buchung freigeben kann.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
        className="hidden"
        id="kostenuebernahme-upload-input"
      />
      <label
        htmlFor="kostenuebernahme-upload-input"
        className={`self-start rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 ${
          uploading ? "pointer-events-none opacity-50" : "cursor-pointer"
        }`}
      >
        {uploading ? "Wird hochgeladen…" : "PDF hochladen"}
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
