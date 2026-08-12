"use client";

import { useState } from "react";
import type { AbsenceType } from "@woodaa/validators";
import { ABSENCE_TYPE_LABELS } from "@/components/dashboard/DienstplanCalendar";
import { weekdayOptions } from "@/lib/weekdayLabels";
import { trpc } from "@/lib/trpc";

// Selbstbedienung für ein MITARBEITER-Login (siehe requireOwnEmployeeProfile
// in operator.ts): eigenes Verfügbarkeitsmuster pflegen und Abwesenheiten
// beantragen, ohne dass der Chef das für einen einträgt. Wird ausschließlich
// im MITARBEITER-Zweig von app/betreiber/dashboard/layout.tsx gerendert.
export function MyScheduleSelfService() {
  const profile = trpc.operator.myEmployeeProfile.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MyAvailability
        availabilities={profile.data?.availabilities ?? []}
        isLoading={profile.isLoading}
      />
      <MyAbsences />
    </div>
  );
}

function MyAvailability({
  availabilities,
  isLoading,
}: {
  availabilities: { weekday: number; available: boolean }[];
  isLoading: boolean;
}) {
  const utils = trpc.useUtils();
  const setMyAvailability = trpc.operator.setMyAvailability.useMutation({
    onSuccess: () => utils.operator.myEmployeeProfile.invalidate(),
  });

  function availabilityFor(weekday: number) {
    return availabilities.find((a) => a.weekday === weekday);
  }

  return (
    <div className="flex flex-col gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4">
      <div>
        <h3 className="font-semibold text-brand-heading">Meine Verfügbarkeit</h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          An welchen Wochentagen du grundsätzlich einsetzbar bist - hilft dem Team bei der
          Schichtplanung.
        </p>
      </div>
      {isLoading ? (
        <p className="text-sm text-brand-text-muted">Lädt…</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {weekdayOptions.map(({ value, label }) => {
            const availability = availabilityFor(value);
            const isAvailable = availability ? availability.available : true;
            return (
              <button
                key={value}
                type="button"
                disabled={setMyAvailability.isPending}
                onClick={() =>
                  setMyAvailability.mutate({
                    weekday: value,
                    available: availability ? !availability.available : false,
                  })
                }
                className={
                  isAvailable
                    ? "rounded-brand-md border border-brand-accent bg-brand-accent/10 px-3 py-1.5 text-xs font-medium text-brand-accent disabled:opacity-50"
                    : "rounded-brand-md border border-brand-border px-3 py-1.5 text-xs text-brand-text-muted line-through disabled:opacity-50"
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MyAbsences() {
  const utils = trpc.useUtils();
  const myAbsences = trpc.operator.myAbsences.useQuery();
  const [type, setType] = useState<AbsenceType>("URLAUB");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => utils.operator.myAbsences.invalidate();
  const requestAbsence = trpc.operator.requestAbsence.useMutation({
    onSuccess: () => {
      setStartDate("");
      setEndDate("");
      setNote("");
      invalidate();
    },
    onError: (err) => setError(err.message),
  });
  const cancelRequest = trpc.operator.cancelMyAbsenceRequest.useMutation({
    onSuccess: invalidate,
    onError: (err) => setError(err.message),
  });

  return (
    <div className="flex flex-col gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4">
      <div>
        <h3 className="font-semibold text-brand-heading">Abwesenheit beantragen</h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Urlaub oder Krankheit melden - der Chef entscheidet, danach erscheint es im Dienstplan.
        </p>
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          if (!startDate || !endDate) return;
          requestAbsence.mutate({
            type,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            note: note.trim() || undefined,
          });
        }}
      >
        <div className="flex flex-wrap gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs text-brand-text-muted">
            Art
            <select
              value={type}
              onChange={(event) => setType(event.target.value as AbsenceType)}
              className="rounded-brand-md border border-brand-border px-2 py-1.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {(Object.keys(ABSENCE_TYPE_LABELS) as AbsenceType[]).map((value) => (
                <option key={value} value={value}>
                  {ABSENCE_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-brand-text-muted">
            Von
            <input
              type="date"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-brand-md border border-brand-border px-2 py-1.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-brand-text-muted">
            Bis
            <input
              type="date"
              required
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-brand-md border border-brand-border px-2 py-1.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        </div>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Notiz (optional)"
          className="rounded-brand-md border border-brand-border px-2 py-1.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <button
          type="submit"
          disabled={requestAbsence.isPending}
          className="self-start rounded-brand-md bg-brand-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {requestAbsence.isPending ? "…" : "Beantragen"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {myAbsences.data && myAbsences.data.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-brand-border pt-3">
          {myAbsences.data.map((absence) => (
            <div
              key={absence.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-brand-md border border-brand-border px-2.5 py-1.5 text-xs"
            >
              <span className="text-brand-text">
                {ABSENCE_TYPE_LABELS[absence.type]} ·{" "}
                {new Intl.DateTimeFormat("de-DE").format(new Date(absence.startDate))}
                {" – "}
                {new Intl.DateTimeFormat("de-DE").format(new Date(absence.endDate))}
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={
                    absence.status === "GENEHMIGT"
                      ? "font-medium text-brand-accent"
                      : absence.status === "ABGELEHNT"
                        ? "font-medium text-red-600"
                        : "font-medium text-brand-text-muted"
                  }
                >
                  {absence.status === "GENEHMIGT"
                    ? "Genehmigt"
                    : absence.status === "ABGELEHNT"
                      ? "Abgelehnt"
                      : "Ausstehend"}
                </span>
                {absence.status === "AUSSTEHEND" && (
                  <button
                    type="button"
                    disabled={cancelRequest.isPending}
                    onClick={() => cancelRequest.mutate({ absenceId: absence.id })}
                    className="text-brand-text-muted hover:text-red-600 disabled:opacity-50"
                  >
                    Zurückziehen
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
