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
  // Stornobedingungen - separate widget below (number input, not text), see
  // cancellationPolicyDays in schema.prisma.
  cancellationPolicyDays: number | null;
};

const fields: {
  name: keyof Omit<HouseRules, "cancellationPolicyDays">;
  label: string;
  placeholder: string;
}[] = [
  { name: "checkInTime", label: "Check-in", placeholder: "z. B. ab 14:00 Uhr" },
  { name: "checkOutTime", label: "Check-out", placeholder: "z. B. bis 11:00 Uhr" },
  { name: "visitingHours", label: "Besuchszeiten", placeholder: "z. B. täglich 10:00-18:00 Uhr" },
  {
    name: "wifiInfo",
    label: "Internetzugang",
    placeholder: "z. B. kostenloses WLAN in allen Zimmern",
  },
  {
    name: "parkingInfo",
    label: "Parkmöglichkeiten",
    placeholder: "z. B. kostenlose Besucherparkplätze vorhanden",
  },
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
        // Empty text input = "keine Angabe" for the text fields above; for
        // this one an empty input must become null rather than NaN/"" since
        // it's a Prisma Int? column, not a string one.
        const cancellationPolicyDaysRaw = String(form.get("cancellationPolicyDays") ?? "").trim();

        try {
          await updateFacility.mutateAsync({
            ...Object.fromEntries(
              fields.map(({ name }) => [name, String(form.get(name) ?? "").trim()]),
            ),
            cancellationPolicyDays:
              cancellationPolicyDaysRaw === "" ? null : Number(cancellationPolicyDaysRaw),
          });
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

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Stornobedingungen: Kostenlos stornierbar bis (Tage vorher)
        <input
          name="cancellationPolicyDays"
          type="number"
          min={0}
          max={365}
          defaultValue={houseRules.cancellationPolicyDays ?? ""}
          placeholder="z. B. 2"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <span className="text-xs text-brand-text-muted">
          Leer lassen für „keine Angabe". Ändert nichts an der tatsächlichen Erstattung - eine
          Stornierung wird derzeit immer vollständig erstattet, unabhängig vom Zeitpunkt.
        </span>
      </label>

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
