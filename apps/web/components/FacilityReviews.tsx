import Link from "next/link";
import type { Review } from "@woodaa/api";
import { StarRating } from "@/components/StarRating";
import { formatDate } from "@/lib/format";

export function FacilityReviews({
  facilitySlug,
  reviews,
  avgRating,
  reviewCount,
}: {
  facilitySlug: string;
  reviews: Review[];
  avgRating: number | null;
  reviewCount: number;
}) {
  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-brand-text">Bewertungen</h2>

      {reviewCount > 0 ? (
        <div className="mt-3 flex items-center gap-3">
          <StarRating rating={avgRating ?? 0} />
          <span className="font-semibold text-brand-heading">
            {avgRating!.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
          </span>
          <span className="text-sm text-brand-text-muted">
            ({reviewCount} {reviewCount === 1 ? "Bewertung" : "Bewertungen"})
          </span>
        </div>
      ) : (
        <p className="mt-3 text-sm text-brand-text-muted">Noch keine Bewertungen.</p>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-brand-md border border-brand-border px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-brand-text">{review.reviewerName}</span>
              <span className="text-xs text-brand-text-muted">{formatDate(review.createdAt)}</span>
            </div>
            <div className="mt-1">
              <StarRating rating={review.rating} size="sm" />
            </div>
            {review.comment && <p className="mt-2 text-sm text-brand-text">{review.comment}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href={`/einrichtung/${facilitySlug}/bewerten`}
          className="inline-block rounded-brand-md border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-text transition hover:bg-brand-background"
        >
          Pflegeheim bewerten
        </Link>
      </div>
    </div>
  );
}
