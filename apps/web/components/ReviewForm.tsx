"use client";

import { useState } from "react";
import { StarRatingInput } from "@/components/StarRatingInput";
import { trpc } from "@/lib/trpc";

export function ReviewForm({ facilityId }: { facilityId: string }) {
  const [rating, setRating] = useState(0);
  const [careRating, setCareRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);
  const createReview = trpc.review.create.useMutation();

  if (createReview.isSuccess) {
    return (
      <div className="rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
        <p className="font-semibold text-brand-primary-dark">
          Danke für deine Bewertung!
        </p>
        <p className="mt-1 text-sm text-brand-text-muted">
          Sie wird nach kurzer Prüfung durch unser Team veröffentlicht.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!rating) return;
        const form = new FormData(event.currentTarget);
        createReview.mutate({
          facilityId,
          reviewerName: String(form.get("reviewerName") ?? ""),
          reviewerEmail: String(form.get("reviewerEmail") ?? ""),
          rating: rating as 1 | 2 | 3 | 4 | 5,
          careRating: (careRating || undefined) as 1 | 2 | 3 | 4 | 5 | undefined,
          cleanlinessRating: (cleanlinessRating || undefined) as
            | 1
            | 2
            | 3
            | 4
            | 5
            | undefined,
          foodRating: (foodRating || undefined) as 1 | 2 | 3 | 4 | 5 | undefined,
          staffRating: (staffRating || undefined) as 1 | 2 | 3 | 4 | 5 | undefined,
          comment: String(form.get("comment") ?? "") || undefined,
        });
      }}
    >
      <h3 className="text-lg font-semibold text-brand-primary-dark">
        Bewertung abgeben
      </h3>

      <StarRatingInput label="Gesamtbewertung" value={rating} onChange={setRating} required />
      <StarRatingInput label="Pflege (optional)" value={careRating} onChange={setCareRating} />
      <StarRatingInput
        label="Sauberkeit (optional)"
        value={cleanlinessRating}
        onChange={setCleanlinessRating}
      />
      <StarRatingInput label="Verpflegung (optional)" value={foodRating} onChange={setFoodRating} />
      <StarRatingInput label="Personal (optional)" value={staffRating} onChange={setStaffRating} />

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Name
        <input
          name="reviewerName"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        E-Mail
        <input
          type="email"
          name="reviewerEmail"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <span className="text-xs text-brand-text-muted">
          Wird nicht veröffentlicht. Muss mit der E-Mail-Adresse deiner
          Buchungsanfrage übereinstimmen.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Kommentar (optional)
        <textarea
          name="comment"
          rows={4}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      {createReview.isError && (
        <p className="text-sm text-red-600">{createReview.error.message}</p>
      )}

      <button
        type="submit"
        disabled={createReview.isPending || !rating}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {createReview.isPending ? "Wird gesendet…" : "Bewertung abschicken"}
      </button>
    </form>
  );
}
