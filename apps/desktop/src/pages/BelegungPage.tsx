import { useState } from "react";
import { ManualBookingDialog } from "../components/belegung/ManualBookingDialog";
import { OccupancyTimeline } from "../components/belegung/OccupancyTimeline";
import { UnitGrid } from "../components/belegung/UnitGrid";
import { WaitlistPanel } from "../components/belegung/WaitlistPanel";
import { bookingTypeLabels, bookingTypeOrder, dateRangedBookingTypes } from "../lib/bookingTypeLabels";
import { formatDate, formatPriceEuro } from "../lib/format";
import { trpc } from "../lib/trpc";
import type { BookingType } from "@woodaa/validators";

export function BelegungPage() {
  const utils = trpc.useUtils();
  const facilityQuery = trpc.operator.myFacility.useQuery();
  const waitlistQuery = trpc.operator.waitlistEntries.useQuery();
  const cancelBooking = trpc.operator.cancelBooking.useMutation({
    onSuccess: () => utils.operator.myFacility.invalidate(),
  });
  const [activeType, setActiveType] = useState<BookingType>("STATIONAERE_AUFNAHME");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showManualBooking, setShowManualBooking] = useState(false);

  if (facilityQuery.isLoading) {
    return <p className="pt-8 text-sm text-ink-400">Lädt…</p>;
  }

  const facility = facilityQuery.data;
  if (!facility) {
    return <p className="pt-8 text-sm text-ink-400">Keine Einrichtung gefunden.</p>;
  }

  const activeUnits = facility.units.filter((unit) => unit.bookingType === activeType);
  const activeCapacity = facility.capacities.find((capacity) => capacity.bookingType === activeType);
  const activeWaitlist = (waitlistQuery.data ?? []).filter(
    (entry) => entry.bookingType === activeType,
  );

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    try {
      await cancelBooking.mutateAsync({ bookingId });
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="pt-8">
      <div className="app-no-drag">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Belegung</h1>
            <p className="mt-1 text-sm text-ink-500">
              Überblick über alle Plätze eurer Einrichtung, nach Betreuungsart.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowManualBooking(true)}
            className="shrink-0 rounded-xl2 bg-accentScale-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-250 ease-out-quart hover:bg-accentScale-600"
          >
            + Neue Buchung
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {bookingTypeOrder.map((type) => {
            const capacity = facility.capacities.find((c) => c.bookingType === type);
            const total = capacity?.totalSlots ?? 0;
            const free = capacity?.availableSlots ?? 0;
            const isActive = type === activeType;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={`rounded-xl2 border px-4 py-2.5 text-left transition-colors duration-250 ease-out-quart ${
                  isActive
                    ? "border-accentScale-500 bg-canvas-panel shadow-sm"
                    : "border-hairline bg-canvas-panel hover:border-hairline-strong"
                }`}
              >
                <p className={`text-sm font-medium ${isActive ? "text-ink-900" : "text-ink-700"}`}>
                  {bookingTypeLabels[type]}
                </p>
                <p className="text-xs text-ink-400">
                  {total === 0 ? "keine Plätze" : `${free} von ${total} frei`}
                </p>
              </button>
            );
          })}
        </div>

        {activeCapacity && (
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-500">
            {activeCapacity.monthlyPriceCents != null && (
              <span>{formatPriceEuro(activeCapacity.monthlyPriceCents)} / Monat (Basis)</span>
            )}
            {activeCapacity.availableFrom && (
              <span>ab {formatDate(activeCapacity.availableFrom)}</span>
            )}
            {activeCapacity.minStayNights != null && (
              <span>mind. {activeCapacity.minStayNights} Nächte</span>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="app-no-drag">
          {dateRangedBookingTypes.includes(activeType) ? (
            <OccupancyTimeline units={activeUnits} />
          ) : (
            <UnitGrid units={activeUnits} onCancelBooking={handleCancel} cancellingId={cancellingId} />
          )}
        </div>
        <div className="app-no-drag">
          <WaitlistPanel entries={activeWaitlist} />
        </div>
      </div>

      {showManualBooking && (
        <ManualBookingDialog
          bookingType={activeType}
          onClose={() => setShowManualBooking(false)}
        />
      )}
    </div>
  );
}
