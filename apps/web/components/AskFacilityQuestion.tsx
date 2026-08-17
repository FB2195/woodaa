"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

// "Message the host" entry point on the facility page - same
// attempt-first-then-redirect-on-401 pattern as FavoriteButton.tsx rather
// than checking auth state upfront, since a logged-out visitor should be
// able to type their question before being asked to log in.
export function AskFacilityQuestion({
  facilityId,
  facilityName,
}: {
  facilityId: string;
  facilityName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const send = trpc.message.send.useMutation();

  if (send.isSuccess) {
    return (
      <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="font-semibold text-brand-heading">Frage gesendet</h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          Deine Nachricht an {facilityName} wurde verschickt. Die Antwort findest du unter{" "}
          <a href="/konto/nachrichten" className="underline hover:text-brand-text">
            Nachrichten
          </a>{" "}
          in deinem Konto.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <h2 className="font-semibold text-brand-heading">Frage an die Einrichtung</h2>
      <p className="mt-1 text-sm text-brand-text-muted">
        Noch unsicher wegen eines freien Zimmers, Haustieren oder etwas anderem? Frag direkt bei{" "}
        {facilityName} nach - unverbindlich und ohne Buchung.
      </p>
      <form
        className="mt-4 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = body.trim();
          if (!value) return;
          setError(null);
          send.mutate(
            { facilityId, body: value },
            {
              onError: (err) => {
                if (err.data?.code === "UNAUTHORIZED") {
                  router.push(`/login?next=${encodeURIComponent(pathname)}`);
                  return;
                }
                setError(err.message);
              },
            },
          );
        }}
      >
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder="z. B. Ist aktuell ein Zimmer für Kurzzeitpflege frei?"
          className="rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <button
          type="submit"
          disabled={send.isPending || !body.trim()}
          className="self-start rounded-brand-md bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {send.isPending ? "Wird gesendet…" : "Frage senden"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
