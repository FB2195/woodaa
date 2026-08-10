"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";

// "Bewohner:innen" area (apps/desktop) - internal, non-clinical notes tied
// to one booking/stay (see ResidentNote in schema.prisma for why it's
// scoped to the booking rather than a resident identity, and why there's
// no author field). operator.residentNotes deliberately returns every
// note across the facility in one call, not per-booking - filtering here
// avoids a separate query per occupied unit; react-query dedupes the
// identical query key across every ResidentNotes instance on the page, so
// this still only hits the network once.
export function ResidentNotes({ bookingId }: { bookingId: string }) {
  const utils = trpc.useUtils();
  const allNotes = trpc.operator.residentNotes.useQuery();
  const notes = allNotes.data?.filter((note) => note.bookingId === bookingId) ?? [];
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => utils.operator.residentNotes.invalidate();
  const addNote = trpc.operator.addResidentNote.useMutation({
    onSuccess: () => {
      setBody("");
      void invalidate();
    },
  });
  const removeNote = trpc.operator.removeResidentNote.useMutation({
    onSuccess: () => void invalidate(),
  });

  async function submit() {
    const value = body.trim();
    if (!value) return;
    setError(null);
    try {
      await addNote.mutateAsync({ bookingId, body: value });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  async function remove(noteId: string) {
    setError(null);
    try {
      await removeNote.mutateAsync({ noteId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-brand-md border border-brand-border bg-brand-background p-4">
      <p className="text-xs text-brand-text-muted">
        Interne Notizen zu diesem Aufenthalt - kein Ersatz für die Pflegedokumentation, nur
        organisatorische Hinweise für euer Team.
      </p>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Neue Notiz…"
          rows={2}
          disabled={addNote.isPending}
          className="flex-1 rounded-brand-md border border-brand-border bg-brand-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <button
          type="submit"
          disabled={addNote.isPending || !body.trim()}
          className="self-start rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Eintragen
        </button>
      </form>

      {allNotes.isLoading ? (
        <p className="text-sm text-brand-text-muted">Lädt…</p>
      ) : notes.length > 0 ? (
        <ul className="flex flex-col gap-2 text-sm">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 rounded-brand-md border border-brand-border bg-brand-surface p-3"
            >
              <div>
                <p className="text-brand-text">{note.body}</p>
                <p className="mt-1 text-xs text-brand-text-muted">
                  {formatDateTime(note.createdAt)}
                </p>
              </div>
              <button
                type="button"
                disabled={removeNote.isPending}
                onClick={() => void remove(note.id)}
                aria-label="Notiz löschen"
                className="shrink-0 text-brand-text-muted hover:text-red-600 disabled:opacity-50"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-text-muted">Noch keine Notizen zu diesem Aufenthalt.</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
