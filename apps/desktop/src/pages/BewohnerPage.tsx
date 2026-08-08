import { useState } from "react";
import { ResidentCard } from "../components/bewohner/ResidentCard";
import { bookingTypeLabels, bookingTypeOrder } from "../lib/bookingTypeLabels";
import { trpc } from "../lib/trpc";
import type { BookingType } from "@woodaa/validators";

export function BewohnerPage() {
  const facilityQuery = trpc.operator.myFacility.useQuery();
  const notesQuery = trpc.operator.residentNotes.useQuery();
  const [filter, setFilter] = useState<BookingType | "ALLE">("ALLE");

  if (facilityQuery.isLoading) {
    return <p className="pt-8 text-sm text-ink-400">Lädt…</p>;
  }

  const facility = facilityQuery.data;
  if (!facility) {
    return <p className="pt-8 text-sm text-ink-400">Keine Einrichtung gefunden.</p>;
  }

  const occupiedUnits = facility.units.filter(
    (unit) => unit.bookings.length > 0 && (filter === "ALLE" || unit.bookingType === filter),
  );

  return (
    <div className="pt-8">
      <div className="app-no-drag">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Bewohner:innen</h1>
        <p className="mt-1 text-sm text-ink-500">
          Nicht-klinische Notizen zu aktuellen Gästen und Bewohner:innen - kein Ersatz für die
          Pflegedokumentation.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("ALLE")}
            className={`rounded-xl2 border px-3.5 py-2 text-sm font-medium transition-colors duration-250 ease-out-quart ${
              filter === "ALLE"
                ? "border-accentScale-500 bg-canvas-panel text-ink-900 shadow-sm"
                : "border-hairline bg-canvas-panel text-ink-700 hover:border-hairline-strong"
            }`}
          >
            Alle
          </button>
          {bookingTypeOrder.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`rounded-xl2 border px-3.5 py-2 text-sm font-medium transition-colors duration-250 ease-out-quart ${
                filter === type
                  ? "border-accentScale-500 bg-canvas-panel text-ink-900 shadow-sm"
                  : "border-hairline bg-canvas-panel text-ink-700 hover:border-hairline-strong"
              }`}
            >
              {bookingTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="app-no-drag mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {occupiedUnits.map((unit) => {
          const booking = unit.bookings[0];
          const notes = (notesQuery.data ?? []).filter((note) => note.bookingId === booking.id);
          return <ResidentCard key={unit.id} unit={unit} booking={booking} notes={notes} />;
        })}
      </div>

      {occupiedUnits.length === 0 && (
        <p className="app-no-drag mt-6 text-sm text-ink-400">
          Aktuell keine belegten Plätze{filter !== "ALLE" ? " in dieser Kategorie" : ""}.
        </p>
      )}
    </div>
  );
}
