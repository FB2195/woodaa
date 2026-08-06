"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function BookingApprovalModeForm({
  mode,
}: {
  mode: "AUTOMATISCH" | "MANUELL";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const updateMode = trpc.operator.updateBookingApprovalMode.useMutation();

  async function setMode(next: "AUTOMATISCH" | "MANUELL") {
    setError(null);
    try {
      await updateMode.mutateAsync({ mode: next });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div>
        <h3 className="font-semibold text-brand-heading">Buchungsbestätigung</h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Legt fest, ob neue Online-Buchungen sofort gelten oder erst nach
          deiner manuellen Prüfung.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2" disabled={updateMode.isPending}>
        <label className="flex items-start gap-2 text-sm text-brand-text">
          <input
            type="radio"
            name="bookingApprovalMode"
            checked={mode === "AUTOMATISCH"}
            onChange={() => setMode("AUTOMATISCH")}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Automatisch bestätigen</span>
            <br />
            <span className="text-brand-text-muted">
              Neue Buchungen sind sofort verbindlich (Standard).
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-brand-text">
          <input
            type="radio"
            name="bookingApprovalMode"
            checked={mode === "MANUELL"}
            onChange={() => setMode("MANUELL")}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Manuell bestätigen</span>
            <br />
            <span className="text-brand-text-muted">
              Neue Buchungen gelten erst als bestätigt, nachdem du sie im
              Dashboard freigegeben hast.
            </span>
          </span>
        </label>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
