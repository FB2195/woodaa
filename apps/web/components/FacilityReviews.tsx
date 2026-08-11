import Link from "next/link";
import type { Review } from "@woodaa/api";
import { StarRating } from "@/components/StarRating";
import { formatDate } from "@/lib/format";

const CATEGORY_LABELS = {
  careRating: "Pflege",
  cleanlinessRating: "Sauberkeit",
  foodRating: "Verpflegung",
  staffRating: "Personal",
} as const;

function categoryAverages(reviews: Review[]): { label: string; avg: number }[] {
  return (Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).flatMap((key) => {
    const values = reviews
      .map((r) => r[key])
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return [];
    return [{ label: CATEGORY_LABELS[key], avg: values.reduce((a, b) => a + b, 0) / values.length }];
  });
}

function CategoryBar({ label, avg }: { label: string; avg: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-brand-text">{label}</span>
        <span className="font-semibold text-brand-heading">
          {avg.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-brand-border">
        <div
          className="h-1.5 rounded-full bg-brand-accent"
          style={{ width: `${(avg / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function FacilityReviews({
  facilitySlug,
  facilityName,
  reviews,
  avgRating,
  reviewCount,
}: {
  facilitySlug: string;
  facilityName: string;
  reviews: Review[];
  avgRating: number | null;
  reviewCount: number;
}) {
  const categories = categoryAverages(reviews);
  // Best-rated reviews with an actual comment, most recent first among
  // ties - same "what guests liked most" idea as Booking.com's curated
  // quote strip, just picked from the reviews we already have rather than
  // a separate editorial process.
  const highlighted = [...reviews]
    .filter((r) => r.comment)
    .sort((a, b) => b.rating - a.rating || b.createdAt.valueOf() - a.createdAt.valueOf())
    .slice(0, 3);

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

      {categories.length > 0 && (
        <div className="mt-5 grid gap-4 rounded-brand-lg border border-brand-border p-5 sm:grid-cols-2">
          {categories.map((c) => (
            <CategoryBar key={c.label} label={c.label} avg={c.avg} />
          ))}
        </div>
      )}

      {highlighted.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-brand-text-muted">
            Was Gästen am besten gefallen hat
          </h3>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
            {highlighted.map((review) => (
              <div
                key={review.id}
                className="w-64 shrink-0 rounded-brand-md border border-brand-border p-4"
              >
                <p className="font-medium text-brand-text">{review.reviewerName}</p>
                <p className="mt-2 line-clamp-4 text-sm text-brand-text-muted">
                  „{review.comment}“
                </p>
              </div>
            ))}
          </div>
        </div>
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
            {review.operatorReply && (
              <div className="mt-3 ml-4 rounded-brand-md border-l-2 border-brand-accent bg-brand-background px-4 py-3">
                <p className="text-xs font-semibold text-brand-accent">
                  Antwort von {facilityName}
                </p>
                <p className="mt-1 text-sm text-brand-text">{review.operatorReply}</p>
              </div>
            )}
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
