"use client";

import Image from "next/image";
import Link from "next/link";
import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";

export function MyConversationsSection() {
  const { data, isLoading } = trpc.message.myConversations.useQuery();

  if (isLoading || !data) return null;

  if (data.length === 0) {
    return (
      <p className="text-sm text-brand-text-muted">
        Du hast noch keine Einrichtung über woodaa kontaktiert. Auf einer Einrichtungsseite findest
        du den Button „Frage stellen".
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.map((conversation) => (
        <li key={conversation.id}>
          <Link
            href={`/konto/nachrichten/${conversation.id}`}
            className="flex gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-md"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-brand-md">
              {conversation.facility.photos[0]?.url ? (
                <Image
                  src={conversation.facility.photos[0].url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <PlaceholderPhoto
                  category={conversation.facility.photos[0]?.category ?? "AUSSENANSICHT"}
                  seed={conversation.facility.slug}
                  className="absolute inset-0 h-full w-full"
                />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-brand-heading">
                  {conversation.facility.name}
                </p>
                {conversation.unread && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden />
                )}
              </div>
              {conversation.lastMessage && (
                <p
                  className={`mt-1 truncate text-sm ${
                    conversation.unread ? "font-medium text-brand-text" : "text-brand-text-muted"
                  }`}
                >
                  {conversation.lastMessage.senderIsFacility ? "" : "Du: "}
                  {conversation.lastMessage.body}
                </p>
              )}
              <p className="mt-1 text-xs text-brand-text-muted">
                {formatDateTime(conversation.lastMessageAt)}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
