"use client";

import type { BookingType, Pflegegrad } from "@woodaa/validators";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";

type Rate = {
  pflegegrad: number;
  dailyRateCents: number | null;
  monthlyRateCents: number | null;
  hourlyRateCents: number | null;
};

// Which rate columns apply depends on the booking type - see
// CapacityPflegegradPricing in schema.prisma:
// - STATIONAERE_AUFNAHME: Tagessatz + Monatspauschale
// - KURZZEITPFLEGE: nur Tagessatz
// - TAGESPFLEGE/NACHTPFLEGE: nur Stundensatz
const columnsByType: Record<
  BookingType,
  { key: "dailyRateCents" | "monthlyRateCents" | "hourlyRateCents"; label: string }[]
> = {
  STATIONAERE_AUFNAHME: [
    { key: "dailyRateCents", label: "Tagessatz (€)" },
    { key: "monthlyRateCents", label: "Monatspauschale (€)" },
  ],
  KURZZEITPFLEGE: [{ key: "dailyRateCents", label: "Tagessatz (€)" }],
  TAGESPFLEGE: [{ key: "hourlyRateCents", label: "Stundensatz (€)" }],
  NACHTPFLEGE: [{ key: "hourlyRateCents", label: "Stundensatz (€)" }],
};

// Pflegegrad 0 ("noch keine Einstufung") bekommt in Deutschland keinen
// eigenen verhandelten Pflegesatz - Heime kalkulieren nur für 1-5.
const pricedPflegegrade = pflegegradOptions.filter((option) => option.value > 0);

function centsToEuroInput(cents: number | null): string {
  return cents === null ? "" : String(cents / 100);
}

export function PflegegradPricingTable({
  bookingType,
  rates,
}: {
  bookingType: BookingType;
  rates: Rate[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const setPricing = trpc.operator.setPflegegradPricing.useMutation();
  const columns = columnsByType[bookingType];

  const byPflegegrad = new Map(rates.map((r) => [r.pflegegrad, r]));

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);

        const newRates = pricedPflegegrade.map((option) => {
          const rate: {
            pflegegrad: Pflegegrad;
            dailyRateCents?: number;
            monthlyRateCents?: number;
            hourlyRateCents?: number;
          } = { pflegegrad: option.value };
          for (const column of columns) {
            const raw = String(form.get(`${column.key}-${option.value}`) ?? "").trim();
            if (raw) rate[column.key] = Math.round(Number(raw) * 100);
          }
          return rate;
        });

        try {
          await setPricing.mutateAsync({ bookingType, rates: newRates });
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
        }
      }}
    >
      <p className="text-xs text-brand-text-muted">
        Echte Sätze je Pflegegrad - diese Werte fließen überall dort ein, wo Familien ihren
        voraussichtlichen Eigenanteil sehen.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-brand-text-muted">
              <th className="pb-1 pr-3">Pflegegrad</th>
              {columns.map((column) => (
                <th key={column.key} className="pb-1 pr-3">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pricedPflegegrade.map((option) => {
              const existing = byPflegegrad.get(option.value);
              return (
                <tr key={option.value}>
                  <td className="py-1 pr-3 text-brand-text">{option.label}</td>
                  {columns.map((column) => (
                    <td key={column.key} className="py-1 pr-3">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        name={`${column.key}-${option.value}`}
                        defaultValue={centsToEuroInput(existing?.[column.key] ?? null)}
                        className="w-24 rounded-brand-md border border-brand-border px-2 py-1 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="submit"
        disabled={setPricing.isPending}
        className="mt-1 self-start rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-background disabled:opacity-50"
      >
        {setPricing.isPending ? "…" : "Pflegegrad-Preise speichern"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
