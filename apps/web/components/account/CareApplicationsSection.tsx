"use client";

import { useState } from "react";
import type { BookingType, SettableCareApplicationStatus } from "@woodaa/validators";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";
import { CareApplicationSubmitForm } from "./CareApplicationSubmitForm";

export function CareApplicationsSection() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.careApplication.myCareProfile.useQuery();
  const [openSubmitFor, setOpenSubmitFor] = useState<BookingType | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const updateProfile = trpc.careApplication.updateCareProfile.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });
  const setStatus = trpc.careApplication.setCareApplicationStatus.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });

  if (isLoading || !data) return null;

  const applicationByType = Object.fromEntries(
    data.applications.map((a) => [a.bookingType, a]),
  ) as Partial<Record<BookingType, (typeof data.applications)[number]>>;

  const pflegegradAntragLabel =
    data.pflegegrad === null || data.pflegegrad === 0
      ? "Pflegegrad-Antrag läuft bereits"
      : "Höherstufung ist bereits beantragt";

  return (
    <div>
      <p className="text-sm text-brand-text-muted">
        Hinterlege deine Versicherungsnummer und deinen Pflegegrad - wir
        helfen dir dann, offene Anträge direkt bei eurer Krankenkasse
        einzureichen.
      </p>

      <form
        className="mt-4 flex flex-col gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setProfileError(null);
          const form = new FormData(event.currentTarget);
          const versicherungsnummer = String(form.get("versicherungsnummer") ?? "").trim();
          const pflegegradRaw = String(form.get("pflegegrad") ?? "");
          const krankenkasse = String(form.get("krankenkasse") ?? "").trim();

          try {
            await updateProfile.mutateAsync({
              ...(versicherungsnummer ? { versicherungsnummer } : {}),
              ...(pflegegradRaw !== ""
                ? { pflegegrad: Number(pflegegradRaw) as 0 | 1 | 2 | 3 | 4 | 5 }
                : {}),
              ...(krankenkasse ? { krankenkasse } : {}),
            });
          } catch (err) {
            setProfileError(
              err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
            );
          }
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Versicherungsnummer
          <input
            name="versicherungsnummer"
            defaultValue={data.versicherungsnummer ?? ""}
            placeholder="z. B. A123456789"
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Krankenkasse
          <input
            name="krankenkasse"
            defaultValue={data.krankenkasse ?? ""}
            placeholder="z. B. AOK, TK, Barmer…"
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Aktueller Pflegegrad
          <select
            name="pflegegrad"
            defaultValue={data.pflegegrad ?? ""}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">Nicht angegeben</option>
            {pflegegradOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input
            type="checkbox"
            checked={data.pflegegradAntragLaeuft}
            onChange={(event) =>
              updateProfile.mutate({ pflegegradAntragLaeuft: event.target.checked })
            }
          />
          {pflegegradAntragLabel}
        </label>

        {profileError && <p className="text-sm text-red-600">{profileError}</p>}

        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="self-start rounded-brand-md bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {updateProfile.isPending ? "Wird gespeichert…" : "Speichern"}
        </button>
      </form>

      {!data.krankenkasseConfigured && (
        <p className="mt-3 text-xs text-brand-text-muted">
          Die digitale Antragstellung ist aktuell im Pilotbetrieb mit einer
          einzelnen Krankenkasse und noch nicht für alle verfügbar.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {bookingTypeOptions.map(({ value, label }) => {
          const application = applicationByType[value];
          const status = application?.status ?? "MUSS_BEANTRAGT_WERDEN";

          return (
            <div
              key={value}
              className="rounded-brand-md border border-brand-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-brand-text">{label}</span>

                {status === "EINGEREICHT_UEBER_WOODAA" ? (
                  <span className="text-xs font-medium text-brand-accent">
                    Eingereicht am{" "}
                    {application?.submittedAt ? formatDate(application.submittedAt) : "-"}
                  </span>
                ) : (
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus.mutate({
                        bookingType: value,
                        status: event.target.value as SettableCareApplicationStatus,
                      })
                    }
                    className="rounded-brand-md border border-brand-border px-2 py-1 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="MUSS_BEANTRAGT_WERDEN">Muss noch beantragt werden</option>
                    <option value="BEREITS_BEANTRAGT">Bereits beantragt</option>
                  </select>
                )}
              </div>

              {status === "MUSS_BEANTRAGT_WERDEN" && data.krankenkasseConfigured && (
                <>
                  {openSubmitFor === value ? (
                    <CareApplicationSubmitForm
                      bookingType={value}
                      onDone={() => {
                        setOpenSubmitFor(null);
                        utils.careApplication.myCareProfile.invalidate();
                      }}
                      onCancel={() => setOpenSubmitFor(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenSubmitFor(value)}
                      className="mt-2 text-sm font-semibold text-brand-accent underline"
                    >
                      Jetzt online einreichen
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
