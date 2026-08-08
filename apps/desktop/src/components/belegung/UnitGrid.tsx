import { formatDate } from "../../lib/format";
import type { UnitWithBookings } from "./types";

const sourceLabels: Record<UnitWithBookings["bookings"][number]["source"], string> = {
  ONLINE: "online",
  TELEFON: "Telefon",
  VOR_ORT: "vor Ort",
};

export function UnitGrid({
  units,
  onCancelBooking,
  cancellingId,
}: {
  units: UnitWithBookings[];
  onCancelBooking: (bookingId: string) => void;
  cancellingId: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {units.map((unit) => {
        const booking = unit.bookings[0];
        return (
          <div
            key={unit.id}
            className={`group rounded-xl2 border p-4 transition-shadow duration-250 ease-out-quart ${
              booking
                ? "border-hairline bg-canvas-panel"
                : "border-accentScale-100 bg-accentScale-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-ink-900">{unit.label}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  booking
                    ? "bg-ink-900/5 text-ink-500"
                    : "bg-accentScale-500/15 text-accentScale-700"
                }`}
              >
                {booking ? "Belegt" : "Frei"}
              </span>
            </div>

            {booking && (
              <div className="mt-3 space-y-1 text-xs text-ink-500">
                <p className="truncate font-medium text-ink-700">
                  {booking.guestName || "Ohne Namen"}
                </p>
                <p>
                  seit {formatDate(booking.createdAt)} · {sourceLabels[booking.source]}
                </p>
                {booking.user?.vollmachtDocumentKey && (
                  <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    Bevollmächtigte/r
                  </span>
                )}
                <button
                  type="button"
                  disabled={cancellingId === booking.id}
                  onClick={() => onCancelBooking(booking.id)}
                  className="pt-1 text-xs font-medium text-ink-400 opacity-0 transition-opacity duration-250 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
                >
                  Stornieren
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
