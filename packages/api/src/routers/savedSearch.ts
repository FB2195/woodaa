import { TRPCError } from "@trpc/server";
import { CreateSavedSearchInput } from "@woodaa/validators";
import { z } from "zod";
import { matchingFacilitiesForSavedSearch } from "../savedSearchAlerts";
import { protectedProcedure, router } from "../trpc";

const MAX_SAVED_SEARCHES = 10;

export const savedSearchRouter = router({
  myList: protectedProcedure.query(({ ctx }) =>
    ctx.db.savedSearch.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ),

  create: protectedProcedure.input(CreateSavedSearchInput).mutation(async ({ ctx, input }) => {
    const count = await ctx.db.savedSearch.count({ where: { userId: ctx.user.id } });
    if (count >= MAX_SAVED_SEARCHES) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Maximal ${MAX_SAVED_SEARCHES} gespeicherte Suchen.`,
      });
    }

    const bookingType = input.bookingType ?? null;
    const pflegegrad = input.pflegegrad ?? null;
    // Baseline the match set to whatever already matches right now, so
    // saving a search that already has hits doesn't immediately fire an
    // alert email for pre-existing results - checkSavedSearchAlerts only
    // ever reports facilities that are NEW since the last check.
    const currentMatches = await matchingFacilitiesForSavedSearch(ctx.db, {
      city: input.city,
      bookingType,
      pflegegrad,
    });

    return ctx.db.savedSearch.create({
      data: {
        userId: ctx.user.id,
        city: input.city,
        bookingType,
        pflegegrad,
        lastCheckedAt: new Date(),
        lastMatchedFacilityIds: currentMatches.map((f) => f.id),
      },
    });
  }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const search = await ctx.db.savedSearch.findUnique({ where: { id: input.id } });
      if (!search || search.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.savedSearch.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
