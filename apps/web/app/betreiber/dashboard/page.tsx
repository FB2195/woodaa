import { CreateFacilityForm } from "@/components/CreateFacilityForm";
import { FacilityDashboard } from "@/components/dashboard/FacilityDashboard";
import { Header } from "@/components/Header";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function OperatorDashboardPage() {
  const trpcServer = await getTrpcServer();
  const facility = await trpcServer.operator.myFacility();

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-5xl px-6 py-12">
        {facility ? (
          <FacilityDashboard facility={facility} />
        ) : (
          <CreateFacilityForm />
        )}
      </section>
    </main>
  );
}
