"use client";

import { useState } from "react";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";

function toISODate(value: Date | string | null): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

const inputClassName =
  "rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent";

// Adresse, Geburtsdatum, Telefon, Pflegegrad und Krankenkasse wurden bei
// der Registrierung erfasst, waren aber bisher nirgends nachträglich
// bearbeitbar (siehe careApplication.updateCareProfile). Mirrors der
// Mobile-Version (apps/mobile/app/konto/persoenliche-angaben.tsx): zwei
// editierbare Karten statt einer komplett ausgeblendeten - nur die
// Versicherungsnummer selbst ist wie ein Passwortfeld maskierbar, als
// gezielter Schutz für die sensibelste einzelne Angabe.
export function SensitivePersonalData() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.careApplication.myCareProfile.useQuery();
  const [versicherungsnummerVisible, setVersicherungsnummerVisible] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [careError, setCareError] = useState<string | null>(null);

  const updateProfile = trpc.careApplication.updateCareProfile.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });

  if (isLoading || !data) return null;

  const pflegegradAntragLabel =
    data.pflegegrad === null || data.pflegegrad === 0
      ? "Pflegegrad-Antrag läuft bereits"
      : "Höherstufung ist bereits beantragt";

  return (
    <>
      <div className="mt-6 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="text-sm font-semibold text-brand-text">Adresse &amp; Kontakt</h2>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setAddressError(null);
            const form = new FormData(event.currentTarget);
            const vorname = String(form.get("vorname") ?? "").trim();
            const nachname = String(form.get("nachname") ?? "").trim();
            const geburtsdatum = String(form.get("geburtsdatum") ?? "").trim();
            const street = String(form.get("street") ?? "").trim();
            const postalCode = String(form.get("postalCode") ?? "").trim();
            const city = String(form.get("city") ?? "").trim();
            const phone = String(form.get("phone") ?? "").trim();

            try {
              await updateProfile.mutateAsync({
                ...(vorname ? { vorname } : {}),
                ...(nachname ? { nachname } : {}),
                ...(geburtsdatum ? { geburtsdatum } : {}),
                ...(street ? { street } : {}),
                ...(postalCode ? { postalCode } : {}),
                ...(city ? { city } : {}),
                ...(phone ? { phone } : {}),
              });
            } catch (err) {
              setAddressError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
            }
          }}
        >
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm text-brand-text">
              Vorname
              <input name="vorname" defaultValue={data.vorname} className={inputClassName} />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-brand-text">
              Nachname
              <input name="nachname" defaultValue={data.nachname} className={inputClassName} />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Geburtsdatum
            <input
              type="date"
              name="geburtsdatum"
              defaultValue={toISODate(data.geburtsdatum)}
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Straße &amp; Hausnummer
            <input name="street" defaultValue={data.street} className={inputClassName} />
          </label>

          <div className="flex gap-3">
            <label className="flex w-32 flex-col gap-1 text-sm text-brand-text">
              PLZ
              <input name="postalCode" defaultValue={data.postalCode} className={inputClassName} />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-brand-text">
              Stadt
              <input name="city" defaultValue={data.city} className={inputClassName} />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Telefon
            <input name="phone" defaultValue={data.phone} className={inputClassName} />
          </label>

          {addressError && <p className="text-sm text-red-600">{addressError}</p>}

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="self-start rounded-brand-md bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {updateProfile.isPending ? "Wird gespeichert…" : "Speichern"}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="text-sm font-semibold text-brand-text">Pflegeangaben</h2>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setCareError(null);
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
              setCareError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
            }
          }}
        >
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Aktueller Pflegegrad
            <select name="pflegegrad" defaultValue={data.pflegegrad ?? ""} className={inputClassName}>
              <option value="">Nicht angegeben</option>
              {pflegegradOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Krankenkasse
            <input
              name="krankenkasse"
              defaultValue={data.krankenkasse ?? ""}
              placeholder="z. B. AOK, TK, Barmer…"
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-brand-text">
            <span className="flex items-center justify-between gap-2">
              Versicherungsnummer
              <button
                type="button"
                onClick={() => setVersicherungsnummerVisible((v) => !v)}
                className="text-xs font-semibold text-brand-accent underline"
              >
                {versicherungsnummerVisible ? "Verbergen" : "Anzeigen"}
              </button>
            </span>
            <input
              name="versicherungsnummer"
              type={versicherungsnummerVisible ? "text" : "password"}
              defaultValue={data.versicherungsnummer ?? ""}
              placeholder="z. B. A123456789"
              autoCapitalize="characters"
              className={inputClassName}
            />
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

          {careError && <p className="text-sm text-red-600">{careError}</p>}

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="self-start rounded-brand-md bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {updateProfile.isPending ? "Wird gespeichert…" : "Speichern"}
          </button>
        </form>
      </div>
    </>
  );
}
