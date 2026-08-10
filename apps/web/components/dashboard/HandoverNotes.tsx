"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";

// Team-Kommunikation (apps/desktop): a chronological Übergabe/handover feed
// between shifts. Append-only by design (see HandoverNote in
// schema.prisma) - no edit/delete here, so the log stays a reliable
// record of what was actually written when.
export function HandoverNotes() {
  const utils = trpc.useUtils();
  const notes = trpc.operator.handoverNotes.useQuery();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addNote = trpc.operator.addHandoverNote.useMutation({
    onSuccess: () => {
      setBody("");
      void utils.operator.handoverNotes.invalidate();
    },
  });

  async function submit() {
    const value = body.trim();
    if (!value) return;
    setError(null);
    try {
      await addNote.mutateAsync({ body: value });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div>
        <h3 className="font-semibold text-brand-heading">Übergabe</h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Ein gemeinsames Übergabe-Protokoll zwischen Schichten - z.B. „Frau Meier hat heute wenig
          gegessen". Einträge lassen sich bewusst nicht nachträglich ändern oder löschen, damit das
          Protokoll zuverlässig bleibt.
        </p>
      </div>

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
          placeholder="Neuer Übergabe-Eintrag…"
          rows={2}
          disabled={addNote.isPending}
          className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <button
          type="submit"
          disabled={addNote.isPending || !body.trim()}
          className="self-start rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Eintragen
        </button>
      </form>

      {notes.isLoading ? (
        <p className="text-sm text-brand-text-muted">Lädt…</p>
      ) : notes.data && notes.data.length > 0 ? (
        <ul className="flex flex-col gap-2 text-sm">
          {notes.data.map((note) => (
            <li key={note.id} className="rounded-brand-md border border-brand-border p-3">
              <p className="text-brand-text">{note.body}</p>
              <p className="mt-1 text-xs text-brand-text-muted">{formatDateTime(note.createdAt)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-text-muted">
          Noch keine Übergabe-Einträge - trag oben den ersten ein.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
