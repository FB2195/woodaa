"use client";

import type { Review } from "@woodaa/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StarRating } from "@/components/StarRating";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";

function ReviewRow({ review }: { review: Review }) {
  const router = useRouter();
  const [draft, setDraft] = useState(review.operatorReply ?? "");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reply = trpc.operator.replyToReview.useMutation();

  async function submit() {
    setError(null);
    try {
      await reply.mutateAsync({ reviewId: review.id, reply: draft });
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  // PENDING reviews aren't publicly visible yet (see the moderation comment
  // on Review in schema.prisma) - still worth showing here so the operator
  // isn't surprised later, but flagged as such.
  return (
    <li className="flex flex-col gap-2 rounded-brand-md border border-brand-border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-brand-text">{review.reviewerName}</p>
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-brand-text-muted">{formatDate(review.createdAt)}</span>
          </div>
        </div>
        {review.status === "PENDING" && (
          <span className="rounded-brand-full bg-brand-border px-2 py-0.5 text-xs font-medium text-brand-text-muted">
            Wird noch geprüft
          </span>
        )}
      </div>
      {review.comment && <p className="text-brand-text">{review.comment}</p>}

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Deine öffentliche Antwort auf diese Bewertung..."
            className="rounded-brand-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={reply.isPending || draft.trim().length === 0}
              onClick={submit}
              className="rounded-brand-md bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Antwort speichern
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(review.operatorReply ?? "");
                setEditing(false);
                setError(null);
              }}
              className="rounded-brand-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text-muted hover:bg-brand-background"
            >
              Abbrechen
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="mt-1">
          {review.operatorReply ? (
            <div className="ml-4 rounded-brand-md border-l-2 border-brand-accent bg-brand-background px-4 py-3">
              <p className="text-xs font-semibold text-brand-accent">Deine Antwort</p>
              <p className="mt-1 text-sm text-brand-text">{review.operatorReply}</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 rounded-brand-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text hover:bg-brand-background"
          >
            {review.operatorReply ? "Antwort bearbeiten" : "Antworten"}
          </button>
        </div>
      )}
    </li>
  );
}

// Booking.com-style host responses to guest reviews - see Review.operatorReply
// in schema.prisma. Shows every review regardless of moderation status (the
// operator should know what's been said about them even before an admin
// approves it publicly), same as what operator.myFacility already returns.
export function OperatorReviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <h3 className="font-semibold text-brand-heading">Bewertungen ({reviews.length})</h3>
      <ul className="flex flex-col gap-3">
        {reviews.map((review) => (
          <ReviewRow key={review.id} review={review} />
        ))}
      </ul>
    </div>
  );
}
