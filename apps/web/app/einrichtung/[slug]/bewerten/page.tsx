import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ReviewForm } from "@/components/ReviewForm";
import { getTrpcServer } from "@/lib/trpc-server";

type ReviewPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug } = await params;

  const trpcServer = await getTrpcServer();
  const facility = await trpcServer.facility.bySlug({ slug }).catch((err) => {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  });

  // Reached only if the ACCESS_COOKIE middleware check already passed for
  // /bewerten - these calls still authenticate for real via the JWT.
  const [me, eligibility] = await Promise.all([
    trpcServer.auth.me(),
    trpcServer.review.checkEligibility({ facilityId: facility.id }),
  ]);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-primary-dark">Pflegeheim bewerten</h1>
        <p className="mt-1 text-brand-text-muted">
          {facility.name}, {facility.street}, {facility.postalCode} {facility.city}
        </p>

        {eligibility.alreadyReviewed ? (
          <p className="mt-8 rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-brand-text">
            Du hast diese Einrichtung bereits bewertet. Danke für dein Feedback!
          </p>
        ) : eligibility.eligible ? (
          <div className="mt-8">
            <ReviewForm facilityId={facility.id} defaultReviewerName={me.name} />
          </div>
        ) : (
          <p className="mt-8 rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-brand-text">
            Du kannst diese Einrichtung nur bewerten, wenn du sie bereits über woodaa gebucht
            hast. Sobald deine Buchung bestätigt ist, kannst du hier dein Feedback hinterlassen.
          </p>
        )}
      </section>
    </main>
  );
}
