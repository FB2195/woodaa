"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { KostenuebernahmeUpload } from "@/components/booking/KostenuebernahmeUpload";
import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { isWithinFreeCancellationWindow } from "@/lib/cancellationPolicy";
import { formatDate } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/paymentMethodLabels";
import { pflegegradLabels } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";
import { facilityApprovalLabels, type MyBooking } from "./MyBookingsSection";

const paymentStatusLabels: Record<string, string> = {
  AUSSTEHEND: "Zahlung ausstehend",
  BEZAHLT: "Bezahlt",
  WARTET_AUF_HEIM_FREIGABE: "Wartet auf Freigabe der Einrichtung",
  FREIGEGEBEN: "Freigegeben",
  ABGELEHNT: "Zahlung abgelehnt",
  REFUNDIERT: "Erstattet",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-brand-text-muted">{label}</span>
      <span className="text-right text-brand-text">{value}</span>
    </div>
  );
}

export function BookingDetailView({ booking }: { booking: MyBooking }) {
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const cancel = trpc.booking.myCancel.useMutation();

  const isCancelled = booking.status === "STORNIERT";
  const facilityApproval =
    booking.facilityApprovalStatus !== "NICHT_ERFORDERLICH"
      ? facilityApprovalLabels[booking.facilityApprovalStatus]
      : null;
  const coverPhoto = booking.facility.photos[0] ?? null;
  const guestName =
    booking.guestFirstName && `${booking.guestFirstName} ${booking.guestLastName ?? ""}`.trim();

  // Nur relevant, wenn tatsächlich schon Geld eingezogen wurde (Karte/
  // Klarna/PayPal) - bei RECHNUNG/KOSTENUEBERNAHME_KASSE oder noch
  // ausstehender Zahlung gibt es nichts zu erstatten. Reine Vorschau fürs
  // UI (siehe cancellationPolicy.ts) - die tatsächliche Entscheidung trifft
  // der Server in booking.myCancel, unabhängig davon, was hier angezeigt wird.
  const refundEligible =
    booking.paymentStatus === "BEZAHLT"
      ? isWithinFreeCancellationWindow(booking, booking.facility.cancellationPolicyDays, new Date())
      : null;

  async function handleCancel() {
    setError(null);
    try {
      await cancel.mutateAsync({ bookingId: booking.id });
      await utils.booking.myBookings.invalidate();
      setConfirmingCancel(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <div>
      <Link href="/konto/buchungen" className="text-sm text-brand-text-muted hover:text-brand-text">
        ← Zurück zu meinen Buchungen
      </Link>

      <div className="mt-4 overflow-hidden rounded-brand-lg border border-brand-border bg-brand-surface shadow-sm">
        <div className="relative h-48 w-full sm:h-64">
          {coverPhoto?.url ? (
            <Image src={coverPhoto.url} alt="" fill sizes="100vw" className="object-cover" />
          ) : (
            <PlaceholderPhoto
              category={coverPhoto?.category ?? "AUSSENANSICHT"}
              seed={booking.facility.slug}
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/einrichtung/${booking.facility.slug}`}
                className="text-xl font-bold text-brand-heading hover:underline"
              >
                {booking.facility.name}
              </Link>
              <p className="mt-1 text-sm text-brand-text-muted">
                {booking.facility.street}, {booking.facility.postalCode} {booking.facility.city}
              </p>
            </div>

            {isCancelled ? (
              <span className="rounded-brand-full bg-brand-border px-3 py-1 text-xs font-medium text-brand-text-muted">
                Storniert
              </span>
            ) : (
              facilityApproval && (
                <span
                  className={`rounded-brand-full px-3 py-1 text-xs font-medium ${facilityApproval.className}`}
                >
                  {facilityApproval.text}
                </span>
              )
            )}
          </div>

          <Link
            href={`/einrichtung/${booking.facility.slug}`}
            className="mt-3 inline-block rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-background"
          >
            Zur Einrichtung
          </Link>

          <div className="mt-6 divide-y divide-brand-border border-y border-brand-border">
            <DetailRow label="Pflegeart" value={bookingTypeLabels[booking.bookingType]} />
            {booking.startDate && (
              <DetailRow
                label="Zeitraum"
                value={
                  booking.endDate
                    ? `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`
                    : booking.bookingType !== "STATIONAERE_AUFNAHME"
                      ? `ab ${formatDate(booking.startDate)} (ohne Enddatum)`
                      : formatDate(booking.startDate)
                }
              />
            )}
            {booking.desiredStartDate && (
              <DetailRow label="Gewünschter Einzug" value={formatDate(booking.desiredStartDate)} />
            )}
            {booking.hoursPerDay && (
              <DetailRow label="Stunden pro Tag" value={booking.hoursPerDay} />
            )}
            {guestName && <DetailRow label="Für" value={guestName} />}
            {booking.pflegegrad !== null && (
              <DetailRow
                label="Pflegegrad"
                value={pflegegradLabels[booking.pflegegrad as 0 | 1 | 2 | 3 | 4 | 5]}
              />
            )}
            {booking.krankenkasse && (
              <DetailRow label="Krankenkasse" value={booking.krankenkasse} />
            )}
            {booking.paymentMethod && (
              <DetailRow label="Zahlungsart" value={paymentMethodLabels[booking.paymentMethod]} />
            )}
            {booking.paymentStatus && (
              <DetailRow
                label="Zahlungsstatus"
                value={paymentStatusLabels[booking.paymentStatus] ?? booking.paymentStatus}
              />
            )}
            <DetailRow label="Gebucht am" value={formatDate(booking.createdAt)} />
            {booking.cancelledAt && (
              <DetailRow label="Storniert am" value={formatDate(booking.cancelledAt)} />
            )}
          </div>

          {booking.note && (
            <div className="mt-4">
              <p className="text-sm font-medium text-brand-text">Nachricht an die Einrichtung</p>
              <p className="mt-1 text-sm text-brand-text-muted">{booking.note}</p>
            </div>
          )}

          {!isCancelled && booking.paymentMethod === "KOSTENUEBERNAHME_KASSE" && (
            <KostenuebernahmeUpload bookingId={booking.id} />
          )}

          {!isCancelled && (
            <div className="mt-6 border-t border-brand-border pt-4">
              {confirmingCancel ? (
                <div>
                  {refundEligible !== null && (
                    <p
                      className={`mb-2 text-sm ${refundEligible ? "text-brand-text-muted" : "font-medium text-red-600"}`}
                    >
                      {refundEligible
                        ? "Deine Zahlung wird bei Stornierung vollständig erstattet."
                        : "Die kostenlose Stornofrist ist abgelaufen - bei einer Stornierung jetzt bekommst du dein Geld nicht zurück."}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={cancel.isPending}
                      onClick={handleCancel}
                      className="rounded-brand-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {cancel.isPending ? "Storniere…" : "Wirklich stornieren"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingCancel(false)}
                      className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text-muted"
                    >
                      Zurück
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text-muted hover:text-red-600"
                >
                  Buchung stornieren
                </button>
              )}
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
