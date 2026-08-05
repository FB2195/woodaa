"use client";

import { useState } from "react";
import type { BookingType, Pflegegrad } from "@woodaa/validators";
import { formatPriceEuro } from "@/lib/format";
import {
  calculateKurzzeitpflegeEigenanteil,
  calculateStationaerEigenanteil,
  calculateTagesNachtpflegeEigenanteil,
} from "@/lib/pflegekassenZuschuss";
import { pflegegradOptions } from "@/lib/pflegegradLabels";

type PflegegradRate = {
  pflegegrad: number;
  dailyRateCents: number | null;
  monthlyRateCents: number | null;
  hourlyRateCents: number | null;
};

export function PflegekassenZuschussRechner({
  bookingType,
  pflegegradPricing,
}: {
  bookingType: BookingType;
  pflegegradPricing: PflegegradRate[];
}) {
  const [pflegegrad, setPflegegrad] = useState<Pflegegrad | "">("");
  const [days, setDays] = useState(14);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [daysPerMonth, setDaysPerMonth] = useState(20);

  const rate = pflegegrad === "" ? undefined : pflegegradPricing.find((r) => r.pflegegrad === pflegegrad);

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

      {pflegegrad !== "" && !rate && (
        <p className="mt-2 text-xs text-brand-text-muted">
          Für Pflegegrad {pflegegrad} hat die Einrichtung noch keinen Preis hinterlegt.
        </p>
      )}

      {pflegegrad !== "" && rate && bookingType === "STATIONAERE_AUFNAHME" && (
        <>
          {(() => {
            const result = calculateStationaerEigenanteil(pflegegrad, rate);
            if (!result) {
              return (
                <p className="mt-2 text-xs text-brand-text-muted">
                  Für Pflegegrad {pflegegrad} hat die Einrichtung noch keinen Preis hinterlegt.
                </p>
              );
            }
            return (
              <ResultBlock
                pflegegrad={pflegegrad}
                costLabel="Heimpreis"
                costCents={
                  rate.monthlyRateCents ?? (rate.dailyRateCents !== null ? rate.dailyRateCents * 30 : 0)
                }
                costSuffix="/Monat"
                subsidyCents={result.subsidyCents}
                eigenanteilCents={result.eigenanteilCents}
                eigenanteilSuffix="/Monat"
                note={result.note}
              />
            );
          })()}
        </>
      )}

      {pflegegrad !== "" && rate?.dailyRateCents !== null && rate?.dailyRateCents !== undefined && bookingType === "KURZZEITPFLEGE" && (
        <>
          <label className="mt-3 flex items-center gap-2 text-xs text-brand-text-muted">
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
          {(() => {
            const result = calculateKurzzeitpflegeEigenanteil(pflegegrad, rate.dailyRateCents, days);
            return (
              <div className="mt-3 flex flex-col gap-1 text-sm">
                <div className="flex justify-between text-brand-text-muted">
                  <span>Verfügbares Jahresbudget</span>
                  <span>{formatPriceEuro(result.jahresbudgetCents)}</span>
                </div>
                <div className="flex justify-between text-brand-text-muted">
                  <span>Kosten ({days} Tage)</span>
                  <span>{formatPriceEuro(result.totalCostCents)}</span>
                </div>
                <div className="flex justify-between text-brand-accent">
                  <span>− Zuschuss der Pflegekasse</span>
                  <span>−{formatPriceEuro(result.subsidyCents)}</span>
                </div>
                <div className="flex justify-between border-t border-brand-border pt-1 font-semibold text-brand-primary-dark">
                  <span>Dein Eigenanteil</span>
                  <span>{formatPriceEuro(result.eigenanteilCents)}</span>
                </div>
                <div className="flex justify-between text-brand-text-muted">
                  <span>Danach noch verfügbares Jahresbudget</span>
                  <span>{formatPriceEuro(result.remainingBudgetCents)}</span>
                </div>
                {result.note && <p className="mt-1 text-xs text-brand-text-muted">{result.note}</p>}
                <Disclaimer />
              </div>
            );
          })()}
        </>
      )}

      {pflegegrad !== "" &&
        rate?.hourlyRateCents !== null &&
        rate?.hourlyRateCents !== undefined &&
        (bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") && (
          <>
            <div className="mt-3 flex gap-3">
              <label className="flex items-center gap-2 text-xs text-brand-text-muted">
                Stunden/Tag
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={hoursPerDay}
                  onChange={(event) => setHoursPerDay(Math.max(1, Number(event.target.value) || 1))}
                  className="w-14 rounded-brand-md border border-brand-border px-2 py-1 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-brand-text-muted">
                Tage/Monat
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={daysPerMonth}
                  onChange={(event) => setDaysPerMonth(Math.max(1, Number(event.target.value) || 1))}
                  className="w-14 rounded-brand-md border border-brand-border px-2 py-1 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
            </div>
            {(() => {
              const result = calculateTagesNachtpflegeEigenanteil(
                pflegegrad,
                rate.hourlyRateCents,
                hoursPerDay,
                daysPerMonth,
              );
              return (
                <div className="mt-3 flex flex-col gap-1 text-sm">
                  <div className="flex justify-between text-brand-text-muted">
                    <span>Kosten pro Tag</span>
                    <span>{formatPriceEuro(result.dailyCostCents)}</span>
                  </div>
                  <div className="flex justify-between text-brand-accent">
                    <span>− Zuschuss der Pflegekasse</span>
                    <span>−{formatPriceEuro(result.dailySubsidyCents)}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-border pt-1 font-semibold text-brand-primary-dark">
                    <span>Dein Eigenanteil pro Tag</span>
                    <span>{formatPriceEuro(result.dailyEigenanteilCents)}</span>
                  </div>
                  {result.monthlyEigenanteilCents !== null && (
                    <div className="flex justify-between text-brand-text-muted">
                      <span>Voraussichtlich pro Monat ({daysPerMonth} Tage)</span>
                      <span>{formatPriceEuro(result.monthlyEigenanteilCents)}</span>
                    </div>
                  )}
                  {result.note && <p className="mt-1 text-xs text-brand-text-muted">{result.note}</p>}
                  <Disclaimer />
                </div>
              );
            })()}
          </>
        )}
    </div>
  );
}

function ResultBlock({
  costLabel,
  costCents,
  costSuffix,
  subsidyCents,
  eigenanteilCents,
  eigenanteilSuffix,
  note,
}: {
  pflegegrad: Pflegegrad;
  costLabel: string;
  costCents: number;
  costSuffix: string;
  subsidyCents: number;
  eigenanteilCents: number;
  eigenanteilSuffix: string;
  note: string | null;
}) {
  return (
    <div className="mt-3 flex flex-col gap-1 text-sm">
      <div className="flex justify-between text-brand-text-muted">
        <span>{costLabel}</span>
        <span>
          {formatPriceEuro(costCents)}
          {costSuffix}
        </span>
      </div>
      <div className="flex justify-between text-brand-accent">
        <span>− Zuschuss der Pflegekasse</span>
        <span>−{formatPriceEuro(subsidyCents)}</span>
      </div>
      <div className="flex justify-between border-t border-brand-border pt-1 font-semibold text-brand-primary-dark">
        <span>Dein Eigenanteil</span>
        <span>
          {formatPriceEuro(eigenanteilCents)}
          {eigenanteilSuffix}
        </span>
      </div>
      {note && <p className="mt-1 text-xs text-brand-text-muted">{note}</p>}
      <Disclaimer />
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="mt-1 text-xs text-brand-text-muted">
      Unverbindliche Orientierung auf Basis der amtlichen Pauschalbeträge 2026 - alle Angaben
      ohne Gewähr, die tatsächliche Höhe bestätigt eure Pflegekasse.
    </p>
  );
}
