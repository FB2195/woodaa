"use client";

import { useState } from "react";
import type { BookingType, Pflegegrad } from "@woodaa/validators";
import { bookingTypeLabels, dateRangedBookingTypes } from "@/lib/bookingTypeLabels";
import { formatPriceEuro } from "@/lib/format";
import { calculateZuschuss, calculateZuschussForDays } from "@/lib/pflegekassenZuschuss";

type Capacity = {
  bookingType: BookingType;
  monthlyPriceCents: number | null;
  availableSlots: number;
};

export function EigenanteilPreview({
  capacities,
  pflegegrad,
}: {
  capacities: Capacity[];
  pflegegrad: Pflegegrad;
}) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(14);

  const options = capacities.filter(
    (c): c is Capacity & { monthlyPriceCents: number } =>
      c.monthlyPriceCents !== null && c.availableSlots > 0,
  );
  const [bookingType, setBookingType] = useState<BookingType | undefined>(options[0]?.bookingType);
  const selected = options.find((c) => c.bookingType === bookingType) ?? options[0];

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-brand-border pt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-brand-accent hover:underline"
        >
          Voraussichtlichen Eigenanteil berechnen
        </button>
      ) : (
        <div className="flex flex-col gap-2 text-xs">
          {options.length > 1 && (
            <select
              value={selected?.bookingType}
              onChange={(event) => setBookingType(event.target.value as BookingType)}
              className="rounded-brand-md border border-brand-border px-2 py-1 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {options.map((c) => (
                <option key={c.bookingType} value={c.bookingType}>
                  {bookingTypeLabels[c.bookingType]}
                </option>
              ))}
            </select>
          )}

          {selected && dateRangedBookingTypes.includes(selected.bookingType) && (
            <label className="flex items-center gap-2 text-brand-text-muted">
              Anzahl Tage
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(event) => setDays(Math.max(1, Number(event.target.value) || 1))}
                className="w-16 rounded-brand-md border border-brand-border px-2 py-1 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
          )}

          {selected &&
            (() => {
              const result = dateRangedBookingTypes.includes(selected.bookingType)
                ? calculateZuschussForDays(
                    selected.bookingType as Exclude<BookingType, "STATIONAERE_AUFNAHME">,
                    pflegegrad,
                    selected.monthlyPriceCents,
                    days,
                  )
                : {
                    ...calculateZuschuss(selected.bookingType, pflegegrad, selected.monthlyPriceCents),
                    totalCostCents: selected.monthlyPriceCents,
                  };
              return (
                <div className="flex flex-col gap-1 rounded-brand-md bg-brand-background p-2">
                  <div className="flex justify-between text-brand-text-muted">
                    <span>Kosten{dateRangedBookingTypes.includes(selected.bookingType) ? ` (${days} Tage)` : "/Monat"}</span>
                    <span>{formatPriceEuro(result.totalCostCents)}</span>
                  </div>
                  <div className="flex justify-between text-brand-accent">
                    <span>− Zuschuss der Pflegekasse</span>
                    <span>−{formatPriceEuro(result.subsidyCents)}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-border pt-1 font-semibold text-brand-primary-dark">
                    <span>Voraussichtlicher Eigenanteil</span>
                    <span>{formatPriceEuro(result.eigenanteilCents)}</span>
                  </div>
                  {result.note && <p className="text-brand-text-muted">{result.note}</p>}
                  <p className="text-brand-text-muted">
                    Unverbindliche Orientierung auf Basis von Pflegegrad {pflegegrad} und der
                    amtlichen Pauschalbeträge 2026 - alle Angaben ohne Gewähr, die tatsächliche
                    Höhe bestätigt eure Pflegekasse.
                  </p>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
}
