"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";

// Adresse, Geburtsdatum, Telefon, Versicherungsnummer, Pflegegrad und
// Krankenkasse sind sensible Angaben, deshalb standardmäßig ausgeblendet -
// erst nach Klick auf "Anzeigen" sichtbar. Die Bearbeitung von
// Versicherungsnummer/Pflegegrad/Krankenkasse lebte vorher direkt auf der
// Pflegeleistungen-Seite; die zeigt jetzt nur noch den Beantragungs-Flow,
// die Datenpflege gehört hierher zu den restlichen persönlichen Angaben.
export function SensitivePersonalData() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.careApplication.myCareProfile.useQuery();
  const [revealed, setRevealed] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const updateProfile = trpc.careApplication.updateCareProfile.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });

  if (isLoading || !data) return null;

  const pflegegradAntragLabel =
    data.pflegegrad === null || data.pflegegrad === 0
      ? "Pflegegrad-Antrag läuft bereits"
      : "Höherstufung ist bereits beantragt";

  return (
    <div className="mt-6 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-brand-text">
          Adresse, Pflegegrad &amp; Versicherungsdaten
        </h2>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="shrink-0 text-sm font-medium text-brand-accent underline"
        >
          {revealed ? "Ausblenden" : "Anzeigen"}
        </button>
      </div>

      {!revealed ? (
        <p className="mt-2 text-sm text-brand-text-muted">
          Diese Angaben sind sensibel und deshalb standardmäßig ausgeblendet -
          Adresse, Geburtsdatum, Telefon, Pflegegrad, Versicherungsnummer und
          Krankenkasse.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2 border-b border-brand-border pb-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-brand-text-muted">Adresse</span>
              <span className="text-right text-brand-text">
                {data.street || "-"}
                <br />
                {[data.postalCode, data.city].filter(Boolean).join(" ") || "-"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-brand-text-muted">Telefon</span>
              <span className="text-brand-text">{data.phone || "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-brand-text-muted">Geburtsdatum</span>
              <span className="text-brand-text">
                {data.geburtsdatum ? formatDate(data.geburtsdatum) : "-"}
              </span>
            </div>
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setProfileError(null);
              const form = new FormData(event.currentTarget);
              const versicherungsnummer = String(form.get("versicherungsnummer") ?? "").trim();
              const pflegegradRaw = String(form.get("pflegegrad") ?? "");
              const krankenkasse = String(form.get("krankenkasse") ?? "").trim();

              try {
                await updateProfile.mutateAsync({
                  ...(versicherungsnummer ? { versicherungsnummer } : {}),
                  ...(pflegegradRaw !== ""
                    ? { pflegegrad: Number(pflegegradRaw) as 0 | 1 | 2 | 3 | 4 | 5 }
                    : {}),
                  ...(krankenkasse ? { krankenkasse } : {}),
                });
              } catch (err) {
                setProfileError(
                  err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
                );
              }
            }}
          >
            <label className="flex flex-col gap-1 text-sm text-brand-text">
              Versicherungsnummer
              <input
                name="versicherungsnummer"
                defaultValue={data.versicherungsnummer ?? ""}
                placeholder="z. B. A123456789"
                className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-brand-text">
              Krankenkasse
              <input
                name="krankenkasse"
                defaultValue={data.krankenkasse ?? ""}
                placeholder="z. B. AOK, TK, Barmer…"
                className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-brand-text">
              Aktueller Pflegegrad
              <select
                name="pflegegrad"
                defaultValue={data.pflegegrad ?? ""}
                className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                <option value="">Nicht angegeben</option>
                {pflegegradOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-brand-text">
              <input
                type="checkbox"
                checked={data.pflegegradAntragLaeuft}
                onChange={(event) =>
                  updateProfile.mutate({ pflegegradAntragLaeuft: event.target.checked })
                }
              />
              {pflegegradAntragLabel}
            </label>

            {profileError && <p className="text-sm text-red-600">{profileError}</p>}

            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="self-start rounded-brand-md bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {updateProfile.isPending ? "Wird gespeichert…" : "Speichern"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
