import type { Metadata } from "next";
import { OperatorReviews } from "@/components/dashboard/OperatorReviews";
import { getMyFacility } from "@/lib/operatorData";

export const metadata: Metadata = { title: "Bewertungen" };

export default async function OperatorBewertungenPage() {
  const facility = await getMyFacility();
  if (!facility) return null;

  return (
    <>
      <div>
        <h1 className="text-xl font-bold text-brand-heading">Bewertungen</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Was Familien öffentlich über eure Einrichtung schreiben.
        </p>
      </div>
      <OperatorReviews reviews={facility.reviews} />
    </>
  );
}
