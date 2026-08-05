"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StarRating } from "@/components/StarRating";
import { trpc } from "@/lib/trpc";
import type { AdminPendingReview } from "@woodaa/api";

export function PendingReviewRow({ review }: { review: AdminPendingReview }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const approve = trpc.admin.approveReview.useMutation();
  const reject = trpc.admin.rejectReview.useMutation();
  const pending = approve.isPending || reject.isPending;

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <a
            href={`/einrichtung/${review.facility.slug}`}
            className="text-sm text-brand-text-muted underline"
          >
            {review.facility.name}
          </a>
          <h3 className="text-lg font-semibold text-brand-heading">
            {review.reviewerName}
          </h3>
          <div className="mt-1">
            <StarRating rating={review.rating} size="sm" />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-text-muted">
            {review.careRating && <span>Pflege: {review.careRating}/5</span>}
            {review.cleanlinessRating && <span>Sauberkeit: {review.cleanlinessRating}/5</span>}
            {review.foodRating && <span>Verpflegung: {review.foodRating}/5</span>}
            {review.staffRating && <span>Personal: {review.staffRating}/5</span>}
          </div>
          {review.comment && <p className="mt-3 text-sm text-brand-text">{review.comment}</p>}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setError(null);
              try {
                await approve.mutateAsync({ id: review.id });
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
              }
            }}
            className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Freischalten
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setError(null);
              try {
                await reject.mutateAsync({ id: review.id });
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
              }
            }}
            className="rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text-muted transition hover:text-red-600 disabled:opacity-50"
          >
            Ablehnen
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
