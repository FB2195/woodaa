import { TRPCError } from "@trpc/server";
import { CreateReviewInput } from "@woodaa/validators";
import { publicProcedure, router } from "../trpc";

// Duck-typed rather than `instanceof Prisma.PrismaClientKnownRequestError`:
// packages/api and @woodaa/db can end up with distinct resolved copies of
// @prisma/client in a pnpm workspace, which breaks class-identity checks
// even when both point at the same generated client (confirmed empirically
// - the instanceof version silently fell through to a raw 500 here).
function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2002"
  );
}

export const reviewRouter = router({
  create: publicProcedure
    .input(CreateReviewInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await ctx.db.facility.findUnique({
        where: { id: input.facilityId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
      }

      // Verified-reviewer gate: any BookingRequest (any status counts -
      // OFFEN/KONTAKTIERT/ABGESCHLOSSEN/ABGELEHNT all represent genuine
      // contact) with a case-insensitive matching email proves the
      // submitter actually contacted this facility - same email-match
      // pattern as account.ts.
      const hasContact = await ctx.db.bookingRequest.findFirst({
        where: {
          facilityId: input.facilityId,
          requesterEmail: { equals: input.reviewerEmail, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (!hasContact) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Nur Personen, die zuvor eine Buchungsanfrage bei dieser Einrichtung gestellt haben, können eine Bewertung abgeben.",
        });
      }

      try {
        return await ctx.db.review.create({
          data: {
            facilityId: input.facilityId,
            reviewerName: input.reviewerName,
            // Normalized to lowercase before storing - the @@unique
            // constraint on (facilityId, reviewerEmail) is a plain,
            // case-sensitive Postgres comparison, unlike the
            // case-insensitive `mode: "insensitive"` match used for the
            // eligibility check above. Without normalizing here, "one
            // review per person" could be bypassed by resubmitting with
            // different email casing.
            reviewerEmail: input.reviewerEmail.toLowerCase(),
            rating: input.rating,
            careRating: input.careRating,
            cleanlinessRating: input.cleanlinessRating,
            foodRating: input.foodRating,
            staffRating: input.staffRating,
            comment: input.comment,
          },
        });
      } catch (err) {
        if (isUniqueConstraintError(err)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Du hast diese Einrichtung bereits bewertet.",
          });
        }
        throw err;
      }
    }),
});
