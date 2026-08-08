import { useState } from "react";
import { bookingTypeLabels } from "../../lib/bookingTypeLabels";
import { formatDate } from "../../lib/format";
import { trpc } from "../../lib/trpc";
import type { RouterOutputs } from "../../lib/trpc";
import type { UnitWithBookings } from "../belegung/types";

type ResidentNote = RouterOutputs["operator"]["residentNotes"][number];

export function ResidentCard({
  unit,
  booking,
  notes,
}: {
  unit: UnitWithBookings;
  booking: UnitWithBookings["bookings"][number];
  notes: ResidentNote[];
}) {
  const utils = trpc.useUtils();
  const addNote = trpc.operator.addResidentNote.useMutation({
    onSuccess: () => utils.operator.residentNotes.invalidate(),
  });
  const removeNote = trpc.operator.removeResidentNote.useMutation({
    onSuccess: () => utils.operator.residentNotes.invalidate(),
  });
  const [draft, setDraft] = useState("");

  return (
    <div className="rounded-xl2 border border-hairline bg-canvas-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-900">{booking.guestName || "Ohne Namen"}</p>
          <p className="mt-0.5 text-xs text-ink-400">
            {unit.label} · {bookingTypeLabels[unit.bookingType]}
          </p>
          {booking.startDate && (
            <p className="text-xs text-ink-400">
              seit {formatDate(booking.startDate)}
              {booking.endDate ? ` bis ${formatDate(booking.endDate)}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {notes.length === 0 ? (
          <p className="text-xs text-ink-400">Noch keine Notizen.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start justify-between gap-2 rounded-brand-md bg-canvas px-3 py-2"
            >
              <div>
                <p className="text-sm text-ink-700">{note.body}</p>
                <p className="mt-0.5 text-[11px] text-ink-400">{formatDate(note.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeNote.mutate({ noteId: note.id })}
                className="shrink-0 text-xs text-ink-300 opacity-0 transition-opacity duration-250 hover:text-red-600 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          addNote.mutate(
            { bookingId: booking.id, body: draft.trim() },
            { onSuccess: () => setDraft("") },
          );
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Notiz hinzufügen…"
          className="flex-1 rounded-xl2 border border-hairline bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition-shadow duration-250 focus:border-accentScale-500 focus:shadow-xs"
        />
        <button
          type="submit"
          disabled={addNote.isPending || !draft.trim()}
          className="shrink-0 rounded-xl2 bg-accentScale-500 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-250 ease-out-quart hover:bg-accentScale-600 disabled:opacity-50"
        >
          +
        </button>
      </form>
    </div>
  );
}
