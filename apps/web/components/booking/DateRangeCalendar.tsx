"use client";

import { useState } from "react";

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseISODate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, count: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}

// Montag=0 .. Sonntag=6, statt JS' Sonntag=0 .. Samstag=6 - deutsche
// Kalenderwochen beginnen montags.
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

// 6 Wochen à 7 Tage, inkl. Padding-Tagen aus dem Vor-/Folgemonat für ein
// vollständiges Gitter - Padding-Tage sind nicht klickbar.
function buildMonthGrid(monthStart: Date): (Date | null)[] {
  const leadingBlanks = mondayIndex(monthStart);
  const daysInMonth = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
  ).getUTCDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const monthFormatter = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });

// Ein Klick setzt "Von", ein zweiter Klick (auf oder nach dem Von-Datum)
// setzt "Bis" - ohne erneut ins Bis-Feld klicken zu müssen. Ein Klick vor
// dem aktuellen Von-Datum, oder ein dritter Klick nach einer bereits
// abgeschlossenen Auswahl, startet die Auswahl neu. Die Von-/Bis-Textfelder
// bleiben daneben bestehen und bearbeitbar (siehe BookingForm.tsx) - diese
// Komponente ist rein die Klick-Bequemlichkeit obendrauf, kein Ersatz.
export function DateRangeCalendar({
  startDate,
  endDate,
  onChange,
  disabled,
}: {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  disabled?: boolean;
}) {
  const initialMonth = parseISODate(startDate) ?? new Date();
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(initialMonth));

  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  const todayIso = toISODate(new Date());

  function handleDayClick(day: Date) {
    const iso = toISODate(day);
    if (!start || end) {
      // Keine oder eine bereits abgeschlossene Auswahl -> neu beginnen.
      onChange(iso, "");
      return;
    }
    if (iso < startDate) {
      // Klick vor dem Von-Datum -> als neues Von-Datum behandeln.
      onChange(iso, "");
      return;
    }
    onChange(startDate, iso);
  }

  const cells = buildMonthGrid(viewMonth);

  return (
    <div className={`rounded-brand-md border border-brand-border p-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="rounded-brand-md px-2 py-1 text-sm text-brand-text-muted hover:bg-brand-background disabled:opacity-50"
          aria-label="Vorheriger Monat"
        >
          ‹
        </button>
        <span className="text-sm font-medium capitalize text-brand-text">
          {monthFormatter.format(viewMonth)}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="rounded-brand-md px-2 py-1 text-sm text-brand-text-muted hover:bg-brand-background disabled:opacity-50"
          aria-label="Nächster Monat"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-brand-text-muted">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
        {cells.map((day, index) => {
          if (!day) return <div key={index} />;
          const iso = toISODate(day);
          const isPast = iso < todayIso;
          const isStart = iso === startDate;
          const isEnd = iso === endDate;
          const inRange = startDate && endDate && iso > startDate && iso < endDate;

          return (
            <button
              key={index}
              type="button"
              disabled={disabled || isPast}
              onClick={() => handleDayClick(day)}
              className={`rounded-brand-md py-1.5 text-sm transition disabled:cursor-not-allowed disabled:text-brand-text-muted/40 ${
                isStart || isEnd
                  ? "bg-brand-accent font-semibold text-white"
                  : inRange
                    ? "bg-brand-accent/15 text-brand-text"
                    : "text-brand-text hover:bg-brand-background"
              }`}
            >
              {day.getUTCDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
