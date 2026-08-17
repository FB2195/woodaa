"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";

function ConversationThread({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: conversation, isLoading } = trpc.operator.conversation.useQuery({ conversationId });
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reply = trpc.operator.replyToConversation.useMutation();
  const markRead = trpc.operator.markConversationRead.useMutation();
  const markedReadFor = useRef<string | null>(null);

  useEffect(() => {
    if (markedReadFor.current === conversationId) return;
    markedReadFor.current = conversationId;
    markRead.mutate(
      { conversationId },
      { onSuccess: () => void utils.operator.conversations.invalidate() },
    );
    // markRead is a stable-enough mutation object (see AuthContext's similar
    // comment) - only conversationId should re-trigger this.
  }, [conversationId]);

  async function handleSend() {
    const value = body.trim();
    if (!value) return;
    setError(null);
    try {
      await reply.mutateAsync({ conversationId, body: value });
      setBody("");
      await utils.operator.conversation.invalidate({ conversationId });
      await utils.operator.conversations.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  if (isLoading || !conversation) {
    return <p className="text-sm text-brand-text-muted">Lädt…</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-brand-text-muted hover:text-brand-text"
      >
        ← Zurück zur Übersicht
      </button>

      <p className="mt-3 font-semibold text-brand-heading">{conversation.user.name}</p>

      <div className="mt-3 flex flex-col gap-3">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${message.senderIsFacility ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-brand-md px-4 py-2 text-sm ${
                message.senderIsFacility
                  ? "bg-brand-accent text-white"
                  : "bg-brand-background text-brand-text"
              }`}
            >
              {message.body}
            </div>
            <p className="mt-1 text-xs text-brand-text-muted">
              {message.senderIsFacility ? "Du" : conversation.user.name} ·{" "}
              {formatDateTime(message.createdAt)}
            </p>
          </div>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSend();
        }}
      >
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Antwort schreiben…"
          className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <button
          type="submit"
          disabled={reply.isPending || !body.trim()}
          className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {reply.isPending ? "…" : "Senden"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Facility-side inbox for the "message the facility" feature - one login
// per facility (see ResidentNote's comment in schema.prisma for why there's
// no per-staff-member attribution needed), so this is a single shared inbox
// rather than an assignment/routing system.
export function OperatorConversations() {
  const { data, isLoading } = trpc.operator.conversations.useQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const unreadCount = data?.filter((c) => c.unread).length ?? 0;

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div>
        <h3 className="font-semibold text-brand-heading">
          Nachrichten{unreadCount > 0 && ` (${unreadCount} ungelesen)`}
        </h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Fragen von Suchenden über eure Einrichtungsseite - beantworte sie hier direkt.
        </p>
      </div>

      {selectedId ? (
        <ConversationThread conversationId={selectedId} onBack={() => setSelectedId(null)} />
      ) : isLoading ? (
        <p className="text-sm text-brand-text-muted">Lädt…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-brand-text-muted">Noch keine Nachrichten.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-brand-border">
          {data.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-brand-background"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-medium text-brand-text">
                    {conversation.user.name}
                    {conversation.unread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden />
                    )}
                  </p>
                  {conversation.lastMessage && (
                    <p className="truncate text-sm text-brand-text-muted">
                      {conversation.lastMessage.senderIsFacility ? "Du: " : ""}
                      {conversation.lastMessage.body}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-brand-text-muted">
                  {formatDateTime(conversation.lastMessageAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
