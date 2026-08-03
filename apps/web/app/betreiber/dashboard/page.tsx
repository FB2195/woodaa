import { CreateFacilityForm } from "@/components/CreateFacilityForm";
import { FacilityDashboard } from "@/components/dashboard/FacilityDashboard";
import { Header } from "@/components/Header";
import { VerificationBanner } from "@/components/VerificationBanner";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function OperatorDashboardPage() {
  const trpcServer = await getTrpcServer();
  const [me, facility] = await Promise.all([
    trpcServer.auth.me(),
    trpcServer.operator.myFacility(),
  ]);
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

        {facility ? (
          <FacilityDashboard facility={facility} />
        ) : verified ? (
          <CreateFacilityForm />
        ) : null}
      </section>
    </main>
  );
}
