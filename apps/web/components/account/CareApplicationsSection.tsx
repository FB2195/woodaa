"use client";

import Link from "next/link";
import { useState } from "react";
import type { BookingType, SettableCareApplicationStatus } from "@woodaa/validators";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { CareApplicationSubmitForm } from "./CareApplicationSubmitForm";

export function CareApplicationsSection() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.careApplication.myCareProfile.useQuery();
  const [openSubmitFor, setOpenSubmitFor] = useState<BookingType | null>(null);

  const setStatus = trpc.careApplication.setCareApplicationStatus.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });

  if (isLoading || !data) return null;

  const applicationByType = Object.fromEntries(
    data.applications.map((a) => [a.bookingType, a]),
  ) as Partial<Record<BookingType, (typeof data.applications)[number]>>;

  const missingProfileData = !data.versicherungsnummer || data.pflegegrad === null;

  return (
    <div>
      <p className="text-sm text-brand-text-muted">
        Hier kannst du offene Anträge direkt bei eurer Krankenkasse
        einreichen. Versicherungsnummer und Pflegegrad pflegst du unter{" "}
        <Link href="/konto/persoenliche-angaben" className="underline">
          Persönliche Angaben
        </Link>
        .
      </p>

      {missingProfileData && (
        <p className="mt-3 rounded-brand-md bg-brand-background p-3 text-sm text-brand-text-muted">
          Bitte hinterlege zuerst deine Versicherungsnummer und deinen
          Pflegegrad unter{" "}
          <Link
            href="/konto/persoenliche-angaben"
            className="font-medium text-brand-accent underline"
          >
            Persönliche Angaben
          </Link>
          , bevor du Anträge einreichst.
        </p>
      )}

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

              {status === "MUSS_BEANTRAGT_WERDEN" &&
                data.krankenkasseConfigured &&
                !missingProfileData && (
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
