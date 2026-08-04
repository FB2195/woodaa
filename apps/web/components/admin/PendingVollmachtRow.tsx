"use client";

import type { AdminPendingVollmacht } from "@woodaa/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";

export function PendingVollmachtRow({ vollmacht }: { vollmacht: AdminPendingVollmacht }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const approve = trpc.admin.approveVollmacht.useMutation();
  const reject = trpc.admin.rejectVollmacht.useMutation();
  const downloadUrl = trpc.admin.vollmachtDownloadUrl.useQuery(
    { userId: vollmacht.id },
    { enabled: false, retry: false },
  );
  const pending = approve.isPending || reject.isPending;

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-primary-dark">{vollmacht.name}</h3>
          <p className="text-sm text-brand-text-muted">{vollmacht.email}</p>
          <p className="mt-1 text-xs text-brand-text-muted">
            Konto seit {formatDate(vollmacht.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={async () => {
              const result = await downloadUrl.refetch();
              if (result.data?.url) window.open(result.data.url, "_blank");
            }}
            className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text hover:bg-brand-background"
          >
            Vollmacht ansehen
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => approve.mutateAsync({ userId: vollmacht.id }))}
            className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Freigeben
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => reject.mutateAsync({ userId: vollmacht.id }))}
            className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text-muted transition hover:text-red-600 disabled:opacity-50"
          >
            Ablehnen
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
