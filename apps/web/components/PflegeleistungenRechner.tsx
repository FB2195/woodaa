"use client";

import { useState } from "react";
import type { BookingType, Pflegegrad } from "@woodaa/validators";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { formatPriceEuro } from "@/lib/format";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import {
  calculateKurzzeitpflegeEigenanteil,
  calculateStationaerEigenanteil,
  calculateTagesNachtpflegeEigenanteil,
} from "@/lib/pflegekassenZuschuss";

// Größerer, eigenständiger Rechner - im Unterschied zum Rechner auf der
// Einrichtungsseite (PflegekassenZuschussRechner) sind hier die Heimkosten
// frei eintippbar statt an eine konkrete Einrichtung gebunden, damit man
// auch ohne einen bereits ausgewählten Pflegeplatz überschlagen kann.
export function PflegeleistungenRechner() {
  const [bookingType, setBookingType] = useState<BookingType>("STATIONAERE_AUFNAHME");
  const [pflegegrad, setPflegegrad] = useState<Pflegegrad | "">("");

  const [monthlyPriceEuro, setMonthlyPriceEuro] = useState(3200);

  const [dailyRateEuro, setDailyRateEuro] = useState(140);
  const [days, setDays] = useState(14);
  const [alreadyUsedEuro, setAlreadyUsedEuro] = useState(0);

  const [hourlyRateEuro, setHourlyRateEuro] = useState(22);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [daysPerMonth, setDaysPerMonth] = useState(20);

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Pflegeart
          <select
            value={bookingType}
            onChange={(event) => setBookingType(event.target.value as BookingType)}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            {bookingTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Pflegegrad
          <select
            value={pflegegrad}
            onChange={(event) =>
              setPflegegrad(
                event.target.value === "" ? "" : (Number(event.target.value) as Pflegegrad),
              )
            }
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">Bitte wählen…</option>
            {pflegegradOptions
              .filter((option) => option.value > 0)
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </label>
      </div>

      {bookingType === "STATIONAERE_AUFNAHME" && (
        <label className="mt-4 flex flex-col gap-1 text-sm text-brand-text">
          Monatliche Heimkosten
          <span className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={10}
              value={monthlyPriceEuro}
              onChange={(event) =>
                setMonthlyPriceEuro(Math.max(0, Number(event.target.value) || 0))
              }
              className="w-32 rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            €/Monat
          </span>
        </label>
      )}

      {bookingType === "KURZZEITPFLEGE" && (
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Tagessatz
            <span className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={5}
                value={dailyRateEuro}
                onChange={(event) => setDailyRateEuro(Math.max(0, Number(event.target.value) || 0))}
                className="w-24 rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              €/Tag
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Anzahl Tage
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(event) => setDays(Math.max(1, Number(event.target.value) || 1))}
              className="w-24 rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Dieses Jahr bereits genutzt (Kurzzeit-/Verhinderungspflege)
            <span className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={10}
                value={alreadyUsedEuro}
                onChange={(event) =>
                  setAlreadyUsedEuro(Math.max(0, Number(event.target.value) || 0))
                }
                className="w-24 rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              €
            </span>
          </label>
        </div>
      )}

      {(bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") && (
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Stundensatz
            <span className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                value={hourlyRateEuro}
                onChange={(event) =>
                  setHourlyRateEuro(Math.max(0, Number(event.target.value) || 0))
                }
                className="w-24 rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              €/Std.
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Stunden/Tag
            <input
              type="number"
              min={1}
              max={24}
              value={hoursPerDay}
              onChange={(event) => setHoursPerDay(Math.max(1, Number(event.target.value) || 1))}
              className="w-20 rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Tage/Monat
            <input
              type="number"
              min={1}
              max={31}
              value={daysPerMonth}
              onChange={(event) => setDaysPerMonth(Math.max(1, Number(event.target.value) || 1))}
              className="w-20 rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        </div>
      )}

      {pflegegrad === "" && (
        <p className="mt-4 text-sm text-brand-text-muted">
          Wähle einen Pflegegrad, um den voraussichtlichen Zuschuss zu berechnen.
        </p>
      )}

      {pflegegrad !== "" && bookingType === "STATIONAERE_AUFNAHME" && (
        <Result
          {...(() => {
            const result = calculateStationaerEigenanteil(pflegegrad, {
              monthlyRateCents: Math.round(monthlyPriceEuro * 100),
              dailyRateCents: null,
            })!;
            return {
              rows: [
                {
                  label: "Heimkosten",
                  value: formatPriceEuro(Math.round(monthlyPriceEuro * 100)),
                  suffix: "/Monat",
                },
                {
                  label: "− Zuschuss der Pflegekasse",
                  value: `−${formatPriceEuro(result.subsidyCents)}`,
                  accent: true,
                },
              ],
              eigenanteilLabel: "Voraussichtlicher Eigenanteil",
              eigenanteilValue: formatPriceEuro(result.eigenanteilCents),
              eigenanteilSuffix: "/Monat",
              note: result.note,
            };
          })()}
        />
      )}

      {pflegegrad !== "" && bookingType === "KURZZEITPFLEGE" && (
        <Result
          {...(() => {
            const result = calculateKurzzeitpflegeEigenanteil(
              pflegegrad,
              Math.round(dailyRateEuro * 100),
              days,
              Math.round(alreadyUsedEuro * 100),
            );
            const rows = [
              result.alreadyUsedCents > 0
                ? {
                    label: `Jahresbudget (bereits ${formatPriceEuro(result.alreadyUsedCents)} genutzt)`,
                    value: formatPriceEuro(result.availableBudgetCents),
                  }
                : {
                    label: "Verfügbares Jahresbudget",
                    value: formatPriceEuro(result.availableBudgetCents),
                  },
              { label: `Kosten (${days} Tage)`, value: formatPriceEuro(result.totalCostCents) },
              {
                label: "− Zuschuss der Pflegekasse",
                value: `−${formatPriceEuro(result.subsidyCents)}`,
                accent: true,
              },
            ];
            return {
              rows,
              eigenanteilLabel: "Voraussichtlicher Eigenanteil",
              eigenanteilValue: formatPriceEuro(result.eigenanteilCents),
              eigenanteilSuffix: "",
              extraRows: [
                {
                  label: "Danach noch verfügbares Jahresbudget",
                  value: formatPriceEuro(result.remainingBudgetCents),
                },
              ],
              note: result.note,
            };
          })()}
        />
      )}

      {pflegegrad !== "" && (bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") && (
        <Result
          {...(() => {
            const result = calculateTagesNachtpflegeEigenanteil(
              pflegegrad,
              Math.round(hourlyRateEuro * 100),
              hoursPerDay,
              daysPerMonth,
            );
            return {
              rows: [
                { label: "Kosten pro Tag", value: formatPriceEuro(result.dailyCostCents) },
                {
                  label: "− Zuschuss der Pflegekasse",
                  value: `−${formatPriceEuro(result.dailySubsidyCents)}`,
                  accent: true,
                },
              ],
              eigenanteilLabel: "Voraussichtlicher Eigenanteil pro Tag",
              eigenanteilValue: formatPriceEuro(result.dailyEigenanteilCents),
              eigenanteilSuffix: "",
              extraRows:
                result.monthlyEigenanteilCents !== null
                  ? [
                      {
                        label: `Voraussichtlich pro Monat (${daysPerMonth} Tage)`,
                        value: formatPriceEuro(result.monthlyEigenanteilCents),
                      },
                    ]
                  : [],
              note: result.note,
            };
          })()}
        />
      )}
    </div>
  );
}

type ResultRow = { label: string; value: string; accent?: boolean };

function Result({
  rows,
  eigenanteilLabel,
  eigenanteilValue,
  eigenanteilSuffix,
  extraRows = [],
  note,
}: {
  rows: ResultRow[];
  eigenanteilLabel: string;
  eigenanteilValue: string;
  eigenanteilSuffix: string;
  extraRows?: ResultRow[];
  note: string | null;
}) {
  return (
    <div className="mt-6 flex flex-col gap-2 border-t border-brand-border pt-4 text-sm">
      {rows.map((row) => (
        <div
          key={row.label}
          className={`flex justify-between ${row.accent ? "text-brand-accent" : "text-brand-text-muted"}`}
        >
          <span>{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-brand-border pt-2 text-base font-semibold text-brand-heading">
        <span>{eigenanteilLabel}</span>
        <span>
          {eigenanteilValue}
          {eigenanteilSuffix}
        </span>
      </div>
      {extraRows.map((row) => (
        <div key={row.label} className="flex justify-between text-brand-text-muted">
          <span>{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
      {note && <p className="mt-1 text-xs text-brand-text-muted">{note}</p>}
      <p className="mt-1 text-xs text-brand-text-muted">
        Unverbindliche Orientierung auf Basis der amtlichen Pauschalbeträge 2026 - alle Angaben ohne
        Gewähr, die tatsächliche Höhe bestätigt eure Pflegekasse.
      </p>
    </div>
  );
}
