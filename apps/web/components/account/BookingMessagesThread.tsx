"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";

// Zwei-Wege-Nachrichten-Thread mit der Einrichtung - siehe BookingMessage in
// schema.prisma und components/dashboard/BookingMessages.tsx für die
// Betreiber-Seite (gleiches UI-Muster, andere tRPC-Prozeduren).
export function BookingMessagesThread({ bookingId }: { bookingId: string }) {
  const utils = trpc.useUtils();
  const messages = trpc.booking.bookingMessages.useQuery({ bookingId });
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const markRead = trpc.booking.markBookingMessagesRead.useMutation();
  const sendMessage = trpc.booking.sendBookingMessage.useMutation({
    onSuccess: () => {
      setBody("");
      void utils.booking.bookingMessages.invalidate({ bookingId });
    },
    onError: (err) => setError(err.message),
  });

  // Nur beim Öffnen des Threads einmal auslösen, nicht bei jeder
  // Neuzustellung der Nachrichtenliste - markRead absichtlich nicht in den
  // deps, das wäre eine neue Mutation-Referenz auf jedem Render.
  useEffect(() => {
    markRead.mutate({ bookingId });
  }, [bookingId]);

  return (
    <div className="flex flex-col gap-3 rounded-brand-md border border-brand-border bg-brand-background p-4">
      <p className="text-xs text-brand-text-muted">
        Direkter Austausch mit der Einrichtung zu dieser Buchung.
      </p>

      {messages.isLoading ? (
        <p className="text-sm text-brand-text-muted">Lädt…</p>
      ) : messages.data && messages.data.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {messages.data.map((message) => (
            <li
              key={message.id}
              className={`max-w-[85%] rounded-brand-md px-3 py-2 text-sm ${
                message.senderType === "FAMILY"
                  ? "self-end bg-brand-accent/15 text-brand-text"
                  : "self-start bg-brand-surface text-brand-text"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <p className="mt-1 text-xs text-brand-text-muted">
                {message.senderType === "FAMILY" ? "Du" : "Einrichtung"} ·{" "}
                {formatDateTime(message.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-text-muted">Noch keine Nachrichten zu dieser Buchung.</p>
      )}

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = body.trim();
          if (!trimmed) return;
          setError(null);
          sendMessage.mutate({ bookingId, body: trimmed });
        }}
      >
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Nachricht…"
          rows={2}
          disabled={sendMessage.isPending}
          className="flex-1 rounded-brand-md border border-brand-border bg-brand-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <button
          type="submit"
          disabled={sendMessage.isPending || !body.trim()}
          className="self-start rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Senden
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
