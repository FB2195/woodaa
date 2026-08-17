"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc-server";

type Conversation = RouterOutputs["message"]["conversation"];

export function ConversationThreadView({ conversation }: { conversation: Conversation }) {
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const send = trpc.message.send.useMutation();
  const markRead = trpc.message.markRead.useMutation();
  const markedReadFor = useRef<string | null>(null);

  // Once per conversationId, not on every re-render (invalidate below would
  // otherwise trigger this again).
  useEffect(() => {
    if (markedReadFor.current === conversation.id) return;
    markedReadFor.current = conversation.id;
    markRead.mutate({ conversationId: conversation.id });
    // markRead is a stable-enough mutation object (see AuthContext's similar
    // comment) - only conversation.id should re-trigger this.
  }, [conversation.id]);

  async function handleSend() {
    const value = body.trim();
    if (!value) return;
    setError(null);
    try {
      await send.mutateAsync({ facilityId: conversation.facilityId, body: value });
      setBody("");
      await utils.message.conversation.invalidate({ conversationId: conversation.id });
      await utils.message.myConversations.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <div>
      <Link
        href="/konto/nachrichten"
        className="text-sm text-brand-text-muted hover:text-brand-text"
      >
        ← Zurück zu meinen Nachrichten
      </Link>

      <div className="mt-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        <Link
          href={`/einrichtung/${conversation.facility.slug}`}
          className="text-lg font-bold text-brand-heading hover:underline"
        >
          {conversation.facility.name}
        </Link>

        <div className="mt-4 flex flex-col gap-3">
          {conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.senderIsFacility ? "items-start" : "items-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-brand-md px-4 py-2 text-sm ${
                  message.senderIsFacility
                    ? "bg-brand-background text-brand-text"
                    : "bg-brand-accent text-white"
                }`}
              >
                {message.body}
              </div>
              <p className="mt-1 text-xs text-brand-text-muted">
                {message.senderIsFacility ? conversation.facility.operatorName : "Du"} ·{" "}
                {formatDateTime(message.createdAt)}
              </p>
            </div>
          ))}
        </div>

        <form
          className="mt-6 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Nachricht schreiben…"
            className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <button
            type="submit"
            disabled={send.isPending || !body.trim()}
            className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {send.isPending ? "…" : "Senden"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
