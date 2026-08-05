"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function AIChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hallo! Ich bin der woodaa-Chat. Wie kann ich dir helfen?",
    },
  ]);
  const [input, setInput] = useState("");
  const chat = trpc.support.chat.useMutation();

  async function send() {
    const text = input.trim();
    if (!text || chat.isPending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");

    try {
      const { reply } = await chat.mutateAsync({ messages: nextMessages });
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Da ist etwas schiefgelaufen. Nutze gerne den Rückruf oder das Kontaktformular.",
        },
      ]);
    }
  }

  return (
    <div className="flex flex-col rounded-brand-lg border border-brand-border bg-brand-surface p-4">
      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-brand-md px-3 py-2 text-sm ${
              message.role === "user"
                ? "self-end bg-brand-accent text-white"
                : "self-start bg-brand-background text-brand-text"
            }`}
          >
            {message.content}
          </div>
        ))}
        {chat.isPending && (
          <div className="self-start rounded-brand-md bg-brand-background px-3 py-2 text-sm text-brand-text-muted">
            Schreibt…
          </div>
        )}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Frag den woodaa-Chat…"
          className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <button
          type="submit"
          disabled={chat.isPending || !input.trim()}
          className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Senden
        </button>
      </form>
    </div>
  );
}
