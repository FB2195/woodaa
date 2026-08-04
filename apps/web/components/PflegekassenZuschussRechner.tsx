"use client";

import { useState } from "react";
import type { BookingType, Pflegegrad } from "@woodaa/validators";
import { formatPriceEuro } from "@/lib/format";
import { calculateZuschuss } from "@/lib/pflegekassenZuschuss";
import { pflegegradOptions } from "@/lib/pflegegradLabels";

export function PflegekassenZuschussRechner({
  bookingType,
  monthlyPriceCents,
}: {
  bookingType: BookingType;
  monthlyPriceCents: number;
}) {
  const [pflegegrad, setPflegegrad] = useState<Pflegegrad | "">("");

  return (
    <div className="mt-2 rounded-brand-md bg-brand-background p-3">
      <label className="flex items-center gap-2 text-xs text-brand-text-muted">
        Pflegegrad-Zuschuss berechnen:
        <select
          value={pflegegrad}
          onChange={(event) =>
            setPflegegrad(
              event.target.value === "" ? "" : (Number(event.target.value) as Pflegegrad),
            )
          }
          className="rounded-brand-md border border-brand-border px-2 py-1 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          <option value="">Pflegegrad wählen…</option>
          {pflegegradOptions
            .filter((option) => option.value > 0)
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
      </label>

      {pflegegrad !== "" && (
        <>
          {(() => {
            const { subsidyCents, eigenanteilCents, note } = calculateZuschuss(
              bookingType,
              pflegegrad,
              monthlyPriceCents,
            );
            return (
              <div className="mt-3 flex flex-col gap-1 text-sm">
                <div className="flex justify-between text-brand-text-muted">
                  <span>Heimpreis</span>
                  <span>{formatPriceEuro(monthlyPriceCents)}</span>
                </div>
                <div className="flex justify-between text-brand-accent">
                  <span>− Zuschuss der Pflegekasse</span>
                  <span>−{formatPriceEuro(subsidyCents)}</span>
                </div>
                <div className="flex justify-between border-t border-brand-border pt-1 font-semibold text-brand-primary-dark">
                  <span>Dein Eigenanteil</span>
                  <span>{formatPriceEuro(eigenanteilCents)}/Monat</span>
                </div>
                {note && (
                  <p className="mt-1 text-xs text-brand-text-muted">{note}</p>
                )}
                <p className="mt-1 text-xs text-brand-text-muted">
                  Unverbindliche Orientierung auf Basis der amtlichen
                  Pauschalbeträge 2026 - die tatsächliche Höhe bestätigt
                  eure Pflegekasse.
                </p>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
