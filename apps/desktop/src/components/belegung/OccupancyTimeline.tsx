import { useMemo } from "react";
import { formatShortDate, toISODate } from "../../lib/format";
import type { UnitWithBookings } from "./types";

const WINDOW_DAYS = 21;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function dayIndex(date: Date, windowStart: Date): number {
  return Math.round((date.getTime() - windowStart.getTime()) / MS_PER_DAY);
}

const sourceLabels: Record<UnitWithBookings["bookings"][number]["source"], string> = {
  ONLINE: "online",
  TELEFON: "Telefon",
  VOR_ORT: "vor Ort",
};

export function OccupancyTimeline({ units }: { units: UnitWithBookings[] }) {
  const windowStart = useMemo(() => startOfToday(), []);
  const windowEnd = useMemo(
    () => new Date(windowStart.getTime() + WINDOW_DAYS * MS_PER_DAY),
    [windowStart],
  );
  const days = useMemo(
    () =>
      Array.from(
        { length: WINDOW_DAYS },
        (_, i) => new Date(windowStart.getTime() + i * MS_PER_DAY),
      ),
    [windowStart],
  );

  const gridTemplateColumns = `12rem repeat(${WINDOW_DAYS}, minmax(1.75rem, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-xl2 border border-hairline bg-canvas-panel">
      <div className="min-w-[42rem]">
        <div className="grid border-b border-hairline" style={{ gridTemplateColumns }}>
          <div className="px-4 py-2.5 text-xs font-medium text-ink-400">Platz</div>
          {days.map((day) => {
            const isToday = toISODate(day) === toISODate(startOfToday());
            const isMonday = day.getDay() === 1;
            return (
              <div
                key={day.toISOString()}
                className={`border-l border-hairline py-2.5 text-center text-[11px] ${
                  isToday
                    ? "bg-accentScale-50 font-semibold text-accentScale-700"
                    : isMonday
                      ? "bg-canvas text-ink-400"
                      : "text-ink-300"
                }`}
              >
                {formatShortDate(day)}
              </div>
            );
          })}
        </div>

        {units.map((unit) => (
          <div
            key={unit.id}
            className="grid border-b border-hairline last:border-b-0"
            style={{ gridTemplateColumns }}
          >
            <div className="truncate px-4 py-3 text-sm font-medium text-ink-700">{unit.label}</div>
            {/* Percent-based absolute positioning rather than a nested grid
                overlay - bookings on one unit never overlap in time (DB
                exclusion constraint, see availability.ts), so a single
                positioning layer without row-stacking logic is enough. */}
            <div className="relative h-12" style={{ gridColumn: `2 / span ${WINDOW_DAYS}` }}>
              <div
                className="absolute inset-0 grid"
                style={{ gridTemplateColumns: `repeat(${WINDOW_DAYS}, minmax(0, 1fr))` }}
              >
                {days.map((day, i) => (
                  <div
                    key={day.toISOString()}
                    className={`h-full border-l border-hairline ${i % 7 === 0 ? "bg-canvas/60" : ""}`}
                  />
                ))}
              </div>
              {unit.bookings.map((booking) => {
                const rawStart = booking.startDate ? new Date(booking.startDate) : windowStart;
                const rawEnd = booking.endDate ? new Date(booking.endDate) : windowEnd;
                if (rawEnd < windowStart || rawStart > windowEnd) return null;

                const clampedStart = rawStart < windowStart ? windowStart : rawStart;
                const startCol = Math.max(0, dayIndex(clampedStart, windowStart));
                const endCol = Math.min(WINDOW_DAYS, dayIndex(rawEnd, windowStart) + 1);
                const span = Math.max(1, endCol - startCol);
                const leftPct = (startCol / WINDOW_DAYS) * 100;
                const widthPct = (span / WINDOW_DAYS) * 100;

                return (
                  <div
                    key={booking.id}
                    title={`${booking.guestName || "Ohne Namen"} · ${sourceLabels[booking.source]}`}
                    className="absolute inset-y-1.5 flex items-center truncate rounded-brand-sm bg-accentScale-500/85 px-2 text-[11px] font-medium text-white"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  >
                    {booking.guestName || "Belegt"}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {units.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-400">Noch keine Plätze in dieser Kategorie.</p>
        )}
      </div>
    </div>
  );
}
