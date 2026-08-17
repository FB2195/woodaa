"use client";

import { useParams } from "next/navigation";
import { ConversationThreadView } from "@/components/account/ConversationThreadView";
import { Header } from "@/components/Header";
import { trpc } from "@/lib/trpc";

export default function NachrichtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = trpc.message.conversation.useQuery({ conversationId: id });

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        {isLoading ? (
          <p className="text-sm text-brand-text-muted">Lädt…</p>
        ) : data ? (
          <ConversationThreadView conversation={data} />
        ) : (
          <p className="text-sm text-brand-text-muted">Diese Unterhaltung wurde nicht gefunden.</p>
        )}
      </section>
    </main>
  );
}
