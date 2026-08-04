import { TRPCError } from "@trpc/server";
import type { Review } from "@woodaa/db";
import { z } from "zod";
import { withPhotoUrl } from "../r2";
import { adminProcedure, router } from "../trpc";

export type AdminPendingReview = Review & { facility: { name: string; slug: string } };

export const adminRouter = router({
  pendingFacilities: adminProcedure.query(async ({ ctx }) => {
    // Facilities that have only run the quick "get the tool" signup
    // (empty description, never asked to go public) don't belong in the
    // review queue - they show up here once they submit a description via
    // requestPublicListing.
    const facilities = await ctx.db.facility.findMany({
      where: { status: "PENDING_REVIEW", description: { not: "" } },
      include: {
        capacities: true,
        photos: { take: 1, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });
    return facilities.map((f) => ({ ...f, photos: f.photos.map(withPhotoUrl) }));
  }),

  activeFacilities: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.facility.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
  }),

  approveFacility: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await ctx.db.facility.findUnique({ where: { id: input.id } });
      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.facility.update({
        where: { id: input.id },
        data: { status: "ACTIVE" },
      });
    }),

  rejectFacility: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await ctx.db.facility.findUnique({ where: { id: input.id } });
      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.facility.update({
        where: { id: input.id },
        data: { status: "REJECTED" },
      });
    }),

  pendingReviews: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.review.findMany({
      where: { status: "PENDING" },
      include: { facility: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "asc" },
    });
  }),

  approveReview: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({ where: { id: input.id } });
      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.review.update({
        where: { id: input.id },
        data: { status: "APPROVED" },
      });
    }),

  rejectReview: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({ where: { id: input.id } });
      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.review.update({
        where: { id: input.id },
        data: { status: "REJECTED" },
      });
    }),
});
