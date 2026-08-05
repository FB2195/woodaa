import type { Booking, User } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { Review } from "@woodaa/db";
import { z } from "zod";
import { cancelBooking } from "../availability";
import { createPresignedDownloadUrl, withPhotoUrl } from "../r2";
import { adminProcedure, router } from "../trpc";

export type AdminPendingReview = Review & { facility: { name: string; slug: string } };

export type AdminPendingVollmacht = Pick<
  User,
  "id" | "name" | "email" | "vollmachtDocumentKey" | "vollmachtReviewStatus" | "createdAt"
>;

export type AdminPendingBookingApproval = Booking & {
  facility: { name: string; slug: string };
  user: { name: string; email: string; vollmachtReviewStatus: User["vollmachtReviewStatus"] } | null;
};

export const adminRouter = router({
  pendingFacilities: adminProcedure.query(async ({ ctx }) => {
    // Facilities that have only run the quick "get the tool" signup
    // (empty description, never asked to go public) don't belong in the
    // review queue - they show up here once they submit a description via
    // requestPublicListing.
    const facilities = await ctx.db.facility.findMany({
      where: { status: "PENDING_REVIEW", description: { not: "" } },
      include: {
        capacities: { include: { pflegegradPricing: true } },
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

  // Kontaktformular, Rückruf-Anfragen und Fehlermeldungen aus dem Hilfe-
  // Menü landen alle hier - ein gemeinsamer Posteingang statt drei.
  openSupportRequests: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.supportRequest.findMany({
      where: { status: { not: "ERLEDIGT" } },
      orderBy: { createdAt: "asc" },
    });
  }),

  resolveSupportRequest: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.supportRequest.findUnique({ where: { id: input.id } });
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.supportRequest.update({
        where: { id: input.id },
        data: { status: "ERLEDIGT" },
      });
    }),

  // Bevollmächtigte/r Angehörige/r: uploading a Vollmacht is what makes an
  // account bevollmächtigt at all (see User.vollmachtDocumentKey) - this is
  // the account-level trust check, separate from (and in addition to) the
  // per-booking approval below.
  pendingVollmachten: adminProcedure.query(async ({ ctx }): Promise<AdminPendingVollmacht[]> => {
    return ctx.db.user.findMany({
      where: { vollmachtReviewStatus: "AUSSTEHEND" },
      select: {
        id: true,
        name: true,
        email: true,
        vollmachtDocumentKey: true,
        vollmachtReviewStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  vollmachtDownloadUrl: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input.userId } });
      if (!user?.vollmachtDocumentKey) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return { url: await createPresignedDownloadUrl(user.vollmachtDocumentKey) };
    }),

  approveVollmacht: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { vollmachtReviewStatus: "GEPRUEFT", vollmachtReviewedAt: new Date() },
      });
    }),

  rejectVollmacht: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { vollmachtReviewStatus: "ABGELEHNT", vollmachtReviewedAt: new Date() },
      });
    }),

  // Every booking made from a bevollmächtigt account (see
  // Booking.adminApprovalStatus) - independent of any facility-side
  // payment approval, which runs in parallel via operator.approveBookingPayment.
  pendingBookingApprovals: adminProcedure.query(
    async ({ ctx }): Promise<AdminPendingBookingApproval[]> => {
      return ctx.db.booking.findMany({
        where: { adminApprovalStatus: "AUSSTEHEND" },
        include: {
          facility: { select: { name: true, slug: true } },
          user: { select: { name: true, email: true, vollmachtReviewStatus: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    },
  ),

  approveBookingAdmin: adminProcedure
    .input(z.object({ bookingId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({ where: { id: input.bookingId } });
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.booking.update({
        where: { id: input.bookingId },
        data: { adminApprovalStatus: "FREIGEGEBEN", adminApprovedAt: new Date() },
      });
    }),

  // Storniert die Buchung gleich mit - ohne Freigabe durch woodaa darf eine
  // Buchung von einem bevollmächtigten Account nicht bestehen bleiben,
  // gleiches Prinzip wie operator.rejectBookingPayment.
  rejectBookingAdmin: adminProcedure
    .input(z.object({ bookingId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({ where: { id: input.bookingId } });
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.booking.update({
        where: { id: input.bookingId },
        data: { adminApprovalStatus: "ABGELEHNT" },
      });
      return cancelBooking(ctx.db, booking.id);
    }),
});
