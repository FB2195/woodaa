"use client";

import { trpc } from "@/lib/trpc";

export function ExportDataButton() {
  const query = trpc.account.exportData.useQuery(undefined, { enabled: false });

  async function handleExport() {
    const result = await query.refetch();
    if (!result.data) return;

    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "woodaa-meine-daten.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={query.isFetching}
      className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-background disabled:opacity-50"
    >
      {query.isFetching ? "Wird vorbereitet…" : "Meine Daten exportieren"}
    </button>
  );
}
