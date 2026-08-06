"use client";

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

const reviewStatusLabels: Record<"AUSSTEHEND" | "GEPRUEFT" | "ABGELEHNT", string> = {
  AUSSTEHEND: "Wird geprüft",
  GEPRUEFT: "Geprüft und bestätigt",
  ABGELEHNT: "Abgelehnt",
};

// Bevollmächtigte/r Angehörige/r: booking on behalf of someone else needs a
// Vollmacht on file (reviewed by woodaa, not just self-declared) plus the
// care recipient's name, since that - not the account holder's own name -
// belongs on the booking (see BookingForm.tsx).
export function VollmachtSection() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.careApplication.myCareProfile.useQuery();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const updateProfile = trpc.careApplication.updateCareProfile.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });
  const requestUpload = trpc.careApplication.requestVollmachtUpload.useMutation();
  const confirmUpload = trpc.careApplication.confirmVollmachtUpload.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });

  if (isLoading || !data) return null;

  async function handleFile(file: File) {
    setError(null);
    if (file.type !== "application/pdf") {
      setError("Bitte lade die Vollmacht als PDF hoch.");
      return;
    }
    setUploading(true);
    try {
      const { uploadUrl, key } = await requestUpload.mutateAsync();
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      });
      if (!putRes.ok) {
        throw new Error("Upload fehlgeschlagen.");
      }
      await confirmUpload.mutateAsync({ key });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="text-sm text-brand-text-muted">
        Buchst du für eine andere Person (z. B. deine Eltern)? Lade eine Vollmacht hoch -
        wir prüfen sie, danach kannst du in ihrem Namen buchen. Jede Buchung von diesem
        Konto wird zusätzlich von unserem Team geprüft, bevor sie endgültig bestätigt wird.
      </p>

      {data.isBevollmaechtigt && data.vollmachtReviewStatus && (
        <p
          className={`mt-3 text-sm font-medium ${
            data.vollmachtReviewStatus === "GEPRUEFT"
              ? "text-brand-accent"
              : data.vollmachtReviewStatus === "ABGELEHNT"
                ? "text-red-600"
                : "text-brand-text-muted"
          }`}
        >
          Vollmacht: {reviewStatusLabels[data.vollmachtReviewStatus]}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-5">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Name der Person, für die du buchst
          <input
            name="careRecipientName"
            defaultValue={data.careRecipientName ?? ""}
            placeholder="z. B. Erika Musterfrau"
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value && value !== data.careRecipientName) {
                updateProfile.mutate({ careRecipientName: value });
              }
            }}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <div className="flex items-center gap-3">
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
            id="vollmacht-upload-input"
          />
          <label
            htmlFor="vollmacht-upload-input"
            className={`rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 ${
              uploading ? "pointer-events-none opacity-50" : "cursor-pointer"
            }`}
          >
            {uploading
              ? "Wird hochgeladen…"
              : data.isBevollmaechtigt
                ? "Vollmacht erneut hochladen"
                : "Vollmacht hochladen (PDF)"}
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
