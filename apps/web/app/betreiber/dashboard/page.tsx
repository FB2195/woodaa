import { CreateFacilityForm } from "@/components/CreateFacilityForm";
import { FacilityDashboard } from "@/components/dashboard/FacilityDashboard";
import { Header } from "@/components/Header";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { VerificationBanner } from "@/components/VerificationBanner";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function OperatorDashboardPage() {
  const trpcServer = await getTrpcServer();
  // Fetched separately, before operator.myFacility(): that now requires
  // 2FA to be enabled (see the isOperator middleware in
  // packages/api/src/trpc.ts) and would otherwise reject the whole
  // Promise.all, crashing the page instead of showing the setup prompt an
  // operator actually needs to see.
  const me = await trpcServer.auth.me();

  if (!me.twoFactorEnabled) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-2xl font-bold text-brand-heading">
            Zwei-Faktor-Authentifizierung erforderlich
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Betreiber-Konten benötigen Zwei-Faktor-Authentifizierung, bevor das Dashboard genutzt
            werden kann - richte sie hier einmalig ein.
          </p>
          <div className="mt-8">
            <TwoFactorSetup enabled={me.twoFactorEnabled} />
          </div>
        </section>
      </main>
    );
  }

  const facility = await trpcServer.operator.myFacility();
  const verified = Boolean(me.emailVerifiedAt);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-5xl px-6 py-12">
        {!verified && (
          <div className="mb-8">
            <VerificationBanner email={me.email} />
          </div>
        )}

        {facility ? <FacilityDashboard facility={facility} /> : <CreateFacilityForm />}
      </section>
    </main>
  );
}
