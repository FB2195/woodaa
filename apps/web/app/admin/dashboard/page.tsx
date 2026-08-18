import { Header } from "@/components/Header";
import { ActiveFacilityRow } from "@/components/admin/ActiveFacilityRow";
import { PendingBookingApprovalRow } from "@/components/admin/PendingBookingApprovalRow";
import { PendingFacilityChangeRow } from "@/components/admin/PendingFacilityChangeRow";
import { PendingFacilityRow } from "@/components/admin/PendingFacilityRow";
import { PendingReviewRow } from "@/components/admin/PendingReviewRow";
import { PendingSupportRequestRow } from "@/components/admin/PendingSupportRequestRow";
import { PendingVollmachtRow } from "@/components/admin/PendingVollmachtRow";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { formatDate } from "@/lib/format";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function AdminDashboardPage() {
  const trpcServer = await getTrpcServer();
  // Fetched separately, before any admin.* call: those now require 2FA to
  // be enabled (see the isAdmin middleware in packages/api/src/trpc.ts) and
  // would otherwise reject the whole Promise.all below, crashing the page
  // instead of showing the setup prompt an admin actually needs to see.
  const me = await trpcServer.auth.me();

  if (!me.twoFactorEnabled) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="mx-auto max-w-4xl px-6 py-12">
          <h1 className="text-2xl font-bold text-brand-heading">
            Zwei-Faktor-Authentifizierung erforderlich
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Admin-Konten benötigen Zwei-Faktor-Authentifizierung, bevor das Dashboard genutzt werden
            kann - richte sie hier einmalig ein.
          </p>
          <div className="mt-8">
            <TwoFactorSetup enabled={me.twoFactorEnabled} />
          </div>
        </section>
      </main>
    );
  }

  const [
    pending,
    active,
    pendingReviews,
    pendingVollmachten,
    pendingBookingApprovals,
    openSupportRequests,
    pendingFacilityChanges,
    bookingsWithFailedRefunds,
    escalatedPendingApprovals,
    escalatedBookingRequests,
  ] = await Promise.all([
    trpcServer.admin.pendingFacilities(),
    trpcServer.admin.activeFacilities(),
    trpcServer.admin.pendingReviews(),
    trpcServer.admin.pendingVollmachten(),
    trpcServer.admin.pendingBookingApprovals(),
    trpcServer.admin.openSupportRequests(),
    trpcServer.admin.pendingFacilityChanges(),
    trpcServer.admin.bookingsWithFailedRefunds(),
    trpcServer.admin.escalatedPendingApprovals(),
    trpcServer.admin.escalatedBookingRequests(),
  ]);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <TwoFactorSetup enabled={me.twoFactorEnabled} />
        </div>

        <h1 className="text-2xl font-bold text-brand-heading">Einrichtungen prüfen</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          {pending.length} {pending.length === 1 ? "Einrichtung wartet" : "Einrichtungen warten"}{" "}
          auf Freischaltung
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {pending.length === 0 ? (
            <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
              Aktuell nichts zu prüfen.
            </p>
          ) : (
            pending.map((facility) => <PendingFacilityRow key={facility.id} facility={facility} />)
          )}
        </div>

        <h2 className="mt-12 text-lg font-semibold text-brand-text">Live ({active.length})</h2>
        <ul className="mt-3 flex flex-col gap-1 text-sm text-brand-text-muted">
          {active.map((facility) => (
            <ActiveFacilityRow key={facility.id} facility={facility} />
          ))}
        </ul>

        <h2 className="mt-12 text-2xl font-bold text-brand-heading">
          Kontaktdaten-Änderungen prüfen
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          {pendingFacilityChanges.length}{" "}
          {pendingFacilityChanges.length === 1 ? "Änderung wartet" : "Änderungen warten"} auf
          Freigabe
        </p>
        <div className="mt-6 flex flex-col gap-4">
          {pendingFacilityChanges.length === 0 ? (
            <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
              Aktuell nichts zu prüfen.
            </p>
          ) : (
            pendingFacilityChanges.map((change) => (
              <PendingFacilityChangeRow key={change.id} change={change} />
            ))
          )}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-brand-heading">Bewertungen prüfen</h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          {pendingReviews.length}{" "}
          {pendingReviews.length === 1 ? "Bewertung wartet" : "Bewertungen warten"} auf
          Freischaltung
        </p>
        <div className="mt-6 flex flex-col gap-4">
          {pendingReviews.length === 0 ? (
            <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
              Aktuell nichts zu prüfen.
            </p>
          ) : (
            pendingReviews.map((review) => <PendingReviewRow key={review.id} review={review} />)
          )}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-brand-heading">Vollmachten prüfen</h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          {pendingVollmachten.length}{" "}
          {pendingVollmachten.length === 1 ? "Konto wartet" : "Konten warten"} auf Prüfung
        </p>
        <div className="mt-6 flex flex-col gap-4">
          {pendingVollmachten.length === 0 ? (
            <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
              Aktuell nichts zu prüfen.
            </p>
          ) : (
            pendingVollmachten.map((vollmacht) => (
              <PendingVollmachtRow key={vollmacht.id} vollmacht={vollmacht} />
            ))
          )}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-brand-heading">
          Buchungen von Bevollmächtigten prüfen
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          {pendingBookingApprovals.length}{" "}
          {pendingBookingApprovals.length === 1 ? "Buchung wartet" : "Buchungen warten"} auf
          Freigabe
        </p>
        <div className="mt-6 flex flex-col gap-4">
          {pendingBookingApprovals.length === 0 ? (
            <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
              Aktuell nichts zu prüfen.
            </p>
          ) : (
            pendingBookingApprovals.map((booking) => (
              <PendingBookingApprovalRow key={booking.id} booking={booking} />
            ))
          )}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-brand-heading">Kundenservice-Anfragen</h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          {openSupportRequests.length}{" "}
          {openSupportRequests.length === 1 ? "Anfrage wartet" : "Anfragen warten"} auf Bearbeitung
        </p>
        <div className="mt-6 flex flex-col gap-4">
          {openSupportRequests.length === 0 ? (
            <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
              Aktuell nichts zu prüfen.
            </p>
          ) : (
            openSupportRequests.map((request) => (
              <PendingSupportRequestRow key={request.id} request={request} />
            ))
          )}
        </div>

        {bookingsWithFailedRefunds.length > 0 && (
          <>
            <h2 className="mt-12 text-2xl font-bold text-brand-heading">
              Fehlgeschlagene Rückerstattungen
            </h2>
            <p className="mt-1 text-sm text-brand-text-muted">
              Die Buchung wurde storniert, aber die Stripe-Rückerstattung ist fehlgeschlagen - bitte
              manuell im Stripe-Dashboard prüfen.
            </p>
            <ul className="mt-6 flex flex-col gap-2 text-sm">
              {bookingsWithFailedRefunds.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-brand-md border border-red-200 bg-red-50 p-4 text-red-700"
                >
                  {booking.guestFirstName} {booking.guestLastName} · {booking.facility.name}
                  {booking.stripePaymentIntentId && ` · ${booking.stripePaymentIntentId}`}
                  {booking.refundFailedAt && ` · ${formatDate(booking.refundFailedAt)}`}
                </li>
              ))}
            </ul>
          </>
        )}

        {escalatedPendingApprovals.length > 0 && (
          <>
            <h2 className="mt-12 text-2xl font-bold text-brand-heading">Freigabe überfällig</h2>
            <p className="mt-1 text-sm text-brand-text-muted">
              Diese Buchungen warten schon zu lange auf die Bestätigung/Ablehnung der Einrichtung
              (bookingApprovalMode „Manuell") - der Betreiber wurde per Erinnerungsmail informiert,
              bitte bei Bedarf zusätzlich direkt Kontakt aufnehmen.
            </p>
            <ul className="mt-6 flex flex-col gap-2 text-sm">
              {escalatedPendingApprovals.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-brand-md border border-red-200 bg-red-50 p-4 text-red-700"
                >
                  {booking.guestFirstName} {booking.guestLastName} · {booking.facility.name}
                  {booking.createdAt && ` · gebucht am ${formatDate(booking.createdAt)}`}
                  {booking.approvalEscalatedAt &&
                    ` · eskaliert am ${formatDate(booking.approvalEscalatedAt)}`}
                </li>
              ))}
            </ul>
          </>
        )}

        {escalatedBookingRequests.length > 0 && (
          <>
            <h2 className="mt-12 text-2xl font-bold text-brand-heading">Anfrage überfällig</h2>
            <p className="mt-1 text-sm text-brand-text-muted">
              Diese unverbindlichen Anfragen warten schon zu lange auf eine Antwort der Einrichtung
              - der Betreiber wurde per Erinnerungsmail informiert, bitte bei Bedarf zusätzlich
              direkt Kontakt aufnehmen.
            </p>
            <ul className="mt-6 flex flex-col gap-2 text-sm">
              {escalatedBookingRequests.map((bookingRequest) => (
                <li
                  key={bookingRequest.id}
                  className="rounded-brand-md border border-red-200 bg-red-50 p-4 text-red-700"
                >
                  {bookingRequest.requesterName} · {bookingRequest.facility.name}
                  {bookingRequest.createdAt &&
                    ` · angefragt am ${formatDate(bookingRequest.createdAt)}`}
                  {bookingRequest.escalatedAt &&
                    ` · eskaliert am ${formatDate(bookingRequest.escalatedAt)}`}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
