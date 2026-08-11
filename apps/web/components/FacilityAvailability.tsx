"use client";

import { useState } from "react";
import type { BookingType } from "@woodaa/validators";
import { PflegekassenZuschussRechner } from "@/components/PflegekassenZuschussRechner";
import { WaitlistRowCTA } from "@/components/WaitlistRowCTA";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate, formatPriceEuro } from "@/lib/format";

type Capacity = {
  id: string;
  bookingType: BookingType;
  availableSlots: number;
  totalSlots: number;
  monthlyPriceCents: number | null;
  availableFrom: Date | null;
  pflegegradPricing: { pflegegrad: number; dailyRateCents: number | null; monthlyRateCents: number | null; hourlyRateCents: number | null }[];
};

// Previously rendered every bookingType's full card (Plätze frei, Preis,
// Pflegekassen-Zuschuss-Rechner, ...) all at once - felt "bullig"/heavy per
// user feedback, especially for facilities offering 3-4 types. Now a
// select narrows to one type first, and only that one's detail expands -
// same information, just not all of it competing for attention at once.
export function FacilityAvailability({
  facilityId,
  capacities,
}: {
  facilityId: string;
  capacities: Capacity[];
}) {
  const [selected, setSelected] = useState<BookingType | "">(
    capacities.length === 1 ? (capacities[0]?.bookingType ?? "") : "",
  );
  const capacity = capacities.find((c) => c.bookingType === selected);

  return (
    <div id="verfuegbarkeit" className="mt-10 scroll-mt-20">
      <h2 className="text-lg font-semibold text-brand-text">Verfügbarkeit</h2>

      <label className="mt-3 flex flex-col gap-1 text-sm text-brand-text">
        Betreuungsart wählen
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value as BookingType)}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          <option value="">Bitte wählen…</option>
          {capacities.map((c) => (
            <option key={c.id} value={c.bookingType}>
              {bookingTypeLabels[c.bookingType]}
            </option>
          ))}
        </select>
      </label>

      {capacity && (
        <div className="mt-4 rounded-brand-md border border-brand-border px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-brand-text">{bookingTypeLabels[capacity.bookingType]}</span>
            <span
              className={
                capacity.availableSlots > 0
                  ? "font-semibold text-brand-accent"
                  : "text-brand-text-muted"
              }
            >
              {capacity.availableSlots > 0
                ? `${capacity.availableSlots} von ${capacity.totalSlots} Plätzen frei`
                : "Aktuell belegt"}
            </span>
          </div>
          <p className="mt-1 text-sm text-brand-text-muted">
            {capacity.monthlyPriceCents !== null
              ? `${formatPriceEuro(capacity.monthlyPriceCents)}/Monat (Heimpreis vor Pflegekassen-Zuschuss)`
              : "Preis auf Anfrage"}
          </p>

          {capacity.pflegegradPricing.length > 0 && (
            <PflegekassenZuschussRechner
              bookingType={capacity.bookingType}
              pflegegradPricing={capacity.pflegegradPricing}
            />
          )}

          {capacity.bookingType === "STATIONAERE_AUFNAHME" &&
            capacity.availableSlots === 0 &&
            capacity.availableFrom && (
              <p className="mt-1 text-sm text-brand-text-muted">
                Nächster freier Platz voraussichtlich ab {formatDate(capacity.availableFrom)}
              </p>
            )}

          {capacity.availableSlots === 0 && (
            <WaitlistRowCTA facilityId={facilityId} bookingType={capacity.bookingType} />
          )}
        </div>
      )}
    </div>
  );
}
