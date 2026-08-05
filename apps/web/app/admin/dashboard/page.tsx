import { Header } from "@/components/Header";
import { PendingBookingApprovalRow } from "@/components/admin/PendingBookingApprovalRow";
import { PendingFacilityChangeRow } from "@/components/admin/PendingFacilityChangeRow";
import { PendingFacilityRow } from "@/components/admin/PendingFacilityRow";
import { PendingReviewRow } from "@/components/admin/PendingReviewRow";
import { PendingSupportRequestRow } from "@/components/admin/PendingSupportRequestRow";
import { PendingVollmachtRow } from "@/components/admin/PendingVollmachtRow";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function AdminDashboardPage() {
  const trpcServer = await getTrpcServer();
  const [
    pending,
    active,
    me,
    pendingReviews,
    pendingVollmachten,
    pendingBookingApprovals,
    openSupportRequests,
    pendingFacilityChanges,
  ] = await Promise.all([
    trpcServer.admin.pendingFacilities(),
    trpcServer.admin.activeFacilities(),
    trpcServer.auth.me(),
    trpcServer.admin.pendingReviews(),
    trpcServer.admin.pendingVollmachten(),
    trpcServer.admin.pendingBookingApprovals(),
    trpcServer.admin.openSupportRequests(),
    trpcServer.admin.pendingFacilityChanges(),
  ]);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <TwoFactorSetup enabled={me.twoFactorEnabled} />
        </div>

        <h1 className="text-2xl font-bold text-brand-heading">
          Einrichtungen prüfen
        </h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          {pending.length}{" "}
          {pending.length === 1 ? "Einrichtung wartet" : "Einrichtungen warten"}{" "}
          auf Freischaltung
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {pending.length === 0 ? (
            <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
              Aktuell nichts zu prüfen.
            </p>
          ) : (
            pending.map((facility) => (
              <PendingFacilityRow key={facility.id} facility={facility} />
            ))
          )}
        </div>

        <h2 className="mt-12 text-lg font-semibold text-brand-text">
          Live ({active.length})
        </h2>
        <ul className="mt-3 flex flex-col gap-1 text-sm text-brand-text-muted">
          {active.map((facility) => (
            <li key={facility.id}>
              {facility.name} — {facility.city} · {facility.operatorName}
              {facility.operatorPhone ? ` · ${facility.operatorPhone}` : ""}
              {facility.operatorPhoneDurchwahl ? ` (${facility.operatorPhoneDurchwahl})` : ""} ·{" "}
              {facility.operatorEmail}
            </li>
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

        <h2 className="mt-12 text-2xl font-bold text-brand-heading">
          Bewertungen prüfen
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          {pendingReviews.length}{" "}
          {pendingReviews.length === 1 ? "Bewertung wartet" : "Bewertungen warten"}{" "}
          auf Freischaltung
        </p>
        <div className="mt-6 flex flex-col gap-4">
          {pendingReviews.length === 0 ? (
            <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
              Aktuell nichts zu prüfen.
            </p>
          ) : (
            pendingReviews.map((review) => (
              <PendingReviewRow key={review.id} review={review} />
            ))
          )}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-brand-heading">
          Vollmachten prüfen
        </h2>
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

        <h2 className="mt-12 text-2xl font-bold text-brand-heading">
          Kundenservice-Anfragen
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          {openSupportRequests.length}{" "}
          {openSupportRequests.length === 1 ? "Anfrage wartet" : "Anfragen warten"} auf
          Bearbeitung
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
      </section>
    </main>
  );
}
