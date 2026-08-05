"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import type { SupportRequest } from "@woodaa/api";

const typeLabels: Record<SupportRequest["type"], string> = {
  KONTAKT: "Kontaktformular",
  RUECKRUF: "Rückruf-Anfrage",
  FEHLERMELDUNG: "Fehlermeldung",
};

export function PendingSupportRequestRow({ request }: { request: SupportRequest }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const resolve = trpc.admin.resolveSupportRequest.useMutation();

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-brand-full bg-brand-accent/10 px-2 py-0.5 text-xs font-medium text-brand-accent">
            {typeLabels[request.type]}
          </span>
          <h3 className="mt-2 text-lg font-semibold text-brand-heading">{request.name}</h3>
          <p className="text-sm text-brand-text-muted">
            {request.email}
            {request.phone && ` · ${request.phone}`}
          </p>
          {request.pageUrl && (
            <p className="mt-1 text-xs text-brand-text-muted">Seite: {request.pageUrl}</p>
          )}
          <p className="mt-3 text-sm text-brand-text">{request.message}</p>
          <p className="mt-2 text-xs text-brand-text-muted">{formatDate(request.createdAt)}</p>
        </div>

        <button
          type="button"
          disabled={resolve.isPending}
          onClick={async () => {
            setError(null);
            try {
              await resolve.mutateAsync({ id: request.id });
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
            }
          }}
          className="shrink-0 rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Erledigt
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
