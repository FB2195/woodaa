"use client";

import { useState } from "react";
import type { BookingType, Pflegegrad } from "@woodaa/validators";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatPriceEuro } from "@/lib/format";
import {
  calculateKurzzeitpflegeEigenanteil,
  calculateStationaerEigenanteil,
  calculateTagesNachtpflegeEigenanteil,
} from "@/lib/pflegekassenZuschuss";

type PflegegradRate = {
  pflegegrad: number;
  dailyRateCents: number | null;
  monthlyRateCents: number | null;
  hourlyRateCents: number | null;
};
type Capacity = {
  bookingType: BookingType;
  availableSlots: number;
  pflegegradPricing: PflegegradRate[];
};

// Which capacities actually have a usable rate for this Pflegegrad depends
// on the booking type - see CapacityPflegegradPricing in schema.prisma.
function hasRate(rate: PflegegradRate | undefined, bookingType: BookingType): boolean {
  if (!rate) return false;
  if (bookingType === "STATIONAERE_AUFNAHME") {
    return rate.monthlyRateCents !== null || rate.dailyRateCents !== null;
  }
  if (bookingType === "KURZZEITPFLEGE") return rate.dailyRateCents !== null;
  return rate.hourlyRateCents !== null;
}

export function EigenanteilPreview({
  capacities,
  pflegegrad,
}: {
  capacities: Capacity[];
  pflegegrad: Pflegegrad;
}) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(14);
  const [hoursPerDay, setHoursPerDay] = useState(6);

  const options = capacities.filter(
    (c) => c.availableSlots > 0 && hasRate(c.pflegegradPricing.find((r) => r.pflegegrad === pflegegrad), c.bookingType),
  );
  const [bookingType, setBookingType] = useState<BookingType | undefined>(options[0]?.bookingType);
  const selected = options.find((c) => c.bookingType === bookingType) ?? options[0];
  const rate = selected?.pflegegradPricing.find((r) => r.pflegegrad === pflegegrad);

  if (options.length === 0 || !selected || !rate) {
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
              value={selected.bookingType}
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

          {selected.bookingType === "KURZZEITPFLEGE" && (
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

          {(selected.bookingType === "TAGESPFLEGE" || selected.bookingType === "NACHTPFLEGE") && (
            <label className="flex items-center gap-2 text-brand-text-muted">
              Stunden pro Tag
              <input
                type="number"
                min={1}
                max={24}
                value={hoursPerDay}
                onChange={(event) => setHoursPerDay(Math.max(1, Number(event.target.value) || 1))}
                className="w-16 rounded-brand-md border border-brand-border px-2 py-1 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
          )}

          {selected.bookingType === "STATIONAERE_AUFNAHME" &&
            (() => {
              const result = calculateStationaerEigenanteil(pflegegrad, rate);
              if (!result) return null;
              return (
                <ResultBox>
                  <Row label="Kosten/Monat" value={formatPriceEuro(rate.monthlyRateCents ?? (rate.dailyRateCents ?? 0) * 30)} />
                  <Row label="− Zuschuss der Pflegekasse" value={`−${formatPriceEuro(result.subsidyCents)}`} accent />
                  <Row label="Voraussichtlicher Eigenanteil" value={formatPriceEuro(result.eigenanteilCents)} bold />
                  {result.note && <p className="text-brand-text-muted">{result.note}</p>}
                  <Disclaimer pflegegrad={pflegegrad} />
                </ResultBox>
              );
            })()}

          {selected.bookingType === "KURZZEITPFLEGE" &&
            rate.dailyRateCents !== null &&
            (() => {
              const result = calculateKurzzeitpflegeEigenanteil(pflegegrad, rate.dailyRateCents!, days);
              return (
                <ResultBox>
                  <Row label="Verfügbares Jahresbudget" value={formatPriceEuro(result.jahresbudgetCents)} />
                  <Row label={`Kosten (${days} Tage)`} value={formatPriceEuro(result.totalCostCents)} />
                  <Row label="− Zuschuss der Pflegekasse" value={`−${formatPriceEuro(result.subsidyCents)}`} accent />
                  <Row label="Voraussichtlicher Eigenanteil" value={formatPriceEuro(result.eigenanteilCents)} bold />
                  <Row label="Danach noch verfügbares Budget" value={formatPriceEuro(result.remainingBudgetCents)} />
                  {result.note && <p className="text-brand-text-muted">{result.note}</p>}
                  <Disclaimer pflegegrad={pflegegrad} />
                </ResultBox>
              );
            })()}

          {(selected.bookingType === "TAGESPFLEGE" || selected.bookingType === "NACHTPFLEGE") &&
            rate.hourlyRateCents !== null &&
            (() => {
              const result = calculateTagesNachtpflegeEigenanteil(pflegegrad, rate.hourlyRateCents!, hoursPerDay);
              return (
                <ResultBox>
                  <Row label="Kosten pro Tag" value={formatPriceEuro(result.dailyCostCents)} />
                  <Row label="− Zuschuss der Pflegekasse" value={`−${formatPriceEuro(result.dailySubsidyCents)}`} accent />
                  <Row label="Voraussichtlicher Eigenanteil pro Tag" value={formatPriceEuro(result.dailyEigenanteilCents)} bold />
                  {result.note && <p className="text-brand-text-muted">{result.note}</p>}
                  <Disclaimer pflegegrad={pflegegrad} />
                </ResultBox>
              );
            })()}
        </div>
      )}
    </div>
  );
}

function ResultBox({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1 rounded-brand-md bg-brand-background p-2">{children}</div>;
}

function Row({ label, value, accent, bold }: { label: string; value: string; accent?: boolean; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between ${accent ? "text-brand-accent" : bold ? "border-t border-brand-border pt-1 font-semibold text-brand-heading" : "text-brand-text-muted"}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Disclaimer({ pflegegrad }: { pflegegrad: Pflegegrad }) {
  return (
    <p className="text-brand-text-muted">
      Unverbindliche Orientierung auf Basis von Pflegegrad {pflegegrad} und der amtlichen
      Pauschalbeträge 2026 - alle Angaben ohne Gewähr, die tatsächliche Höhe bestätigt eure
      Pflegekasse.
    </p>
  );
}
