import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking/BookingForm";
import { Header } from "@/components/Header";
import { getTrpcServer } from "@/lib/trpc-server";

type BookingPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;

  const trpcServer = await getTrpcServer();
  const facility = await trpcServer.facility.bySlug({ slug }).catch((err) => {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  });

  // Reached only if the ACCESS_COOKIE middleware check already passed -
  // this call still authenticates for real via the JWT, this just reads
  // the profile to prefill the form.
  const profile = await trpcServer.careApplication.myCareProfile();

  const availableCapacities = facility.capacities.filter((c) => c.availableSlots > 0);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">
          Pflegeplatz buchen
        </h1>
        <p className="mt-1 text-brand-text-muted">
          bei {facility.name}, {facility.street}, {facility.postalCode} {facility.city}
        </p>

        <BookingForm
          facilityId={facility.id}
          capacities={availableCapacities}
          profile={profile}
          cancellationPolicyDays={facility.cancellationPolicyDays}
        />
      </section>
    </main>
  );
}
