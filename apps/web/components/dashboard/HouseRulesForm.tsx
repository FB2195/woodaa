"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

type HouseRules = {
  checkInTime: string | null;
  checkOutTime: string | null;
  visitingHours: string | null;
  wifiInfo: string | null;
  parkingInfo: string | null;
  petsPolicy: string | null;
};

const fields: { name: keyof HouseRules; label: string; placeholder: string }[] = [
  { name: "checkInTime", label: "Check-in", placeholder: "z. B. ab 14:00 Uhr" },
  { name: "checkOutTime", label: "Check-out", placeholder: "z. B. bis 11:00 Uhr" },
  { name: "visitingHours", label: "Besuchszeiten", placeholder: "z. B. täglich 10:00-18:00 Uhr" },
  { name: "wifiInfo", label: "Internetzugang", placeholder: "z. B. kostenloses WLAN in allen Zimmern" },
  { name: "parkingInfo", label: "Parkmöglichkeiten", placeholder: "z. B. kostenlose Besucherparkplätze vorhanden" },
  { name: "petsPolicy", label: "Haustiere", placeholder: "z. B. nach Absprache erlaubt" },
];

// Non-critical - unlike FacilityContactForm, diese Angaben gehen ohne
// Admin-Freigabe sofort live (siehe UpdateFacilityInput/updateFacility).
export function HouseRulesForm({ houseRules }: { houseRules: HouseRules }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const updateFacility = trpc.operator.updateFacility.useMutation();

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);

        try {
          await updateFacility.mutateAsync(
            Object.fromEntries(
              fields.map(({ name }) => [name, String(form.get(name) ?? "").trim()]),
            ),
          );
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
        }
      }}
    >
      <div>
        <h3 className="font-semibold text-brand-heading">Unterkunftsrichtlinien</h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Wird auf der Einrichtungsseite für alle sichtbar angezeigt - Änderungen sind sofort live.
        </p>
      </div>

      {fields.map(({ name, label, placeholder }) => (
        <label key={name} className="flex flex-col gap-1 text-sm text-brand-text">
          {label}
          <input
            name={name}
            defaultValue={houseRules[name] ?? ""}
            placeholder={placeholder}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={updateFacility.isPending}
        className="self-start rounded-brand-md bg-brand-accent px-5 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {updateFacility.isPending ? "Wird gespeichert…" : "Speichern"}
      </button>
    </form>
  );
}
