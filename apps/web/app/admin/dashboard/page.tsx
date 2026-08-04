import { Header } from "@/components/Header";
import { PendingFacilityRow } from "@/components/admin/PendingFacilityRow";
import { PendingReviewRow } from "@/components/admin/PendingReviewRow";
import { TwoFactorSetup } from "@/components/admin/TwoFactorSetup";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function AdminDashboardPage() {
  const trpcServer = await getTrpcServer();
  const [pending, active, me, pendingReviews] = await Promise.all([
    trpcServer.admin.pendingFacilities(),
    trpcServer.admin.activeFacilities(),
    trpcServer.auth.me(),
    trpcServer.admin.pendingReviews(),
  ]);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <TwoFactorSetup enabled={me.twoFactorEnabled} />
        </div>

        <h1 className="text-2xl font-bold text-brand-primary-dark">
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
              {facility.name} — {facility.city}
            </li>
          ))}
        </ul>

        <h2 className="mt-12 text-2xl font-bold text-brand-primary-dark">
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
      </section>
    </main>
  );
}
