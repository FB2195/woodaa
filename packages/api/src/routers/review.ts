import { TRPCError } from "@trpc/server";
import { CreateReviewInput } from "@woodaa/validators";
import { protectedProcedure, router } from "../trpc";

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
  // Drives the dedicated "Pflegeheim bewerten" page: whether the logged-in
  // user may review this facility, and whether they already have.
  checkEligibility: protectedProcedure
    .input(CreateReviewInput.pick({ facilityId: true }))
    .query(async ({ ctx, input }) => {
      const [eligible, existingReview] = await Promise.all([
        ctx.db.booking.findFirst({
          where: { userId: ctx.user.id, facilityId: input.facilityId, status: "BESTAETIGT" },
          select: { id: true },
        }),
        ctx.db.review.findUnique({
          where: { facilityId_userId: { facilityId: input.facilityId, userId: ctx.user.id } },
          select: { id: true },
        }),
      ]);
      return { eligible: eligible !== null, alreadyReviewed: existingReview !== null };
    }),

  create: protectedProcedure.input(CreateReviewInput).mutation(async ({ ctx, input }) => {
    const facility = await ctx.db.facility.findUnique({
      where: { id: input.facilityId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!facility) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
    }

    // Verified-reviewer gate: a confirmed Booking by this account at this
    // facility proves genuine prior use - stronger than the previous
    // self-reported-email-matches-a-BookingRequest check, since it's tied
    // to the authenticated session rather than a client-supplied string.
    const eligible = await ctx.db.booking.findFirst({
      where: { userId: ctx.user.id, facilityId: input.facilityId, status: "BESTAETIGT" },
      select: { id: true },
    });
    if (!eligible) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Nur Personen, die diese Einrichtung bereits gebucht haben, können eine Bewertung abgeben.",
      });
    }

    try {
      return await ctx.db.review.create({
        data: {
          facilityId: input.facilityId,
          userId: ctx.user.id,
          reviewerName: input.reviewerName,
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
