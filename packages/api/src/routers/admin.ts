import type { Booking, FacilityChangeRequest, User } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { Review } from "@woodaa/db";
import { z } from "zod";
import { cancelBooking } from "../availability";
import { geocodeAddress } from "../geocoding";
import { createPresignedDownloadUrl, withPhotoUrl } from "../r2";
import { refundBookingPayment } from "../stripe";
import { adminProcedure, router } from "../trpc";

export type AdminPendingReview = Review & { facility: { name: string; slug: string } };

export type AdminPendingFacilityChange = FacilityChangeRequest & {
  facility: {
    name: string;
    slug: string;
    street: string;
    postalCode: string;
    city: string;
    state: string;
    operatorName: string;
    operatorEmail: string;
    operatorPhone: string | null;
    operatorPhoneDurchwahl: string | null;
  };
};

export type AdminPendingVollmacht = Pick<
  User,
  "id" | "name" | "email" | "vollmachtDocumentKey" | "vollmachtReviewStatus" | "createdAt"
>;

export type AdminPendingBookingApproval = Booking & {
  facility: { name: string; slug: string };
  user: { name: string; email: string; vollmachtReviewStatus: User["vollmachtReviewStatus"] } | null;
};

export type AdminFailedRefundBooking = Booking & { facility: { name: string; slug: string } };

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

  // Stornierte Buchungen, deren Stripe-Rückerstattung fehlgeschlagen ist
  // (siehe refundBookingPayment in stripe.ts) - nur zur Sichtbarkeit, keine
  // eigene "erneut versuchen"-Aktion, die Erstattung läuft dann manuell im
  // Stripe-Dashboard.
  bookingsWithFailedRefunds: adminProcedure.query(
    async ({ ctx }): Promise<AdminFailedRefundBooking[]> => {
      return ctx.db.booking.findMany({
        where: { refundFailedAt: { not: null } },
        include: { facility: { select: { name: true, slug: true } } },
        orderBy: { refundFailedAt: "desc" },
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
  // gleiches Prinzip wie operator.rejectBookingPayment. adminApprovalStatus
  // läuft unabhängig von paymentMethod/paymentStatus - eine bereits per
  // Karte/Klarna/PayPal bezahlte Buchung braucht hier also genau wie bei
  // operator.rejectBooking eine Rückerstattung.
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
      const cancelled = await cancelBooking(ctx.db, booking.id);
      await refundBookingPayment(ctx.db, cancelled);
      return cancelled;
    }),

  // Proposed edits to a facility's name/address/operator contact details -
  // see FacilityChangeRequest in schema.prisma. Old values stay live on
  // Facility until approved here.
  pendingFacilityChanges: adminProcedure.query(
    async ({ ctx }): Promise<AdminPendingFacilityChange[]> => {
      return ctx.db.facilityChangeRequest.findMany({
        where: { status: "PENDING" },
        include: {
          facility: {
            select: {
              name: true,
              slug: true,
              street: true,
              postalCode: true,
              city: true,
              state: true,
              operatorName: true,
              operatorEmail: true,
              operatorPhone: true,
              operatorPhoneDurchwahl: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    },
  ),

  approveFacilityChange: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.facilityChangeRequest.findUnique({
        where: { id: input.id },
      });
      if (!request || request.status !== "PENDING") {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const facility = await ctx.db.facility.findUniqueOrThrow({
        where: { id: request.facilityId },
      });

      const addressChanged =
        (request.street !== null && request.street !== facility.street) ||
        (request.postalCode !== null && request.postalCode !== facility.postalCode) ||
        (request.city !== null && request.city !== facility.city);

      // Only re-geocode when the address actually changed, same reasoning
      // as operator.createFacility - best-effort, doesn't block the update.
      const geo = addressChanged
        ? await geocodeAddress(
            `${request.street ?? facility.street}, ${request.postalCode ?? facility.postalCode} ${request.city ?? facility.city}, Germany`,
          )
        : null;

      const data: Record<string, unknown> = {};
      if (request.name !== null) data.name = request.name;
      if (request.street !== null) data.street = request.street;
      if (request.postalCode !== null) data.postalCode = request.postalCode;
      if (request.city !== null) data.city = request.city;
      if (request.state !== null) data.state = request.state;
      if (request.operatorName !== null) data.operatorName = request.operatorName;
      if (request.operatorEmail !== null) data.operatorEmail = request.operatorEmail;
      if (request.operatorPhone !== null) data.operatorPhone = request.operatorPhone;
      if (request.operatorPhoneDurchwahl !== null)
        data.operatorPhoneDurchwahl = request.operatorPhoneDurchwahl;
      if (addressChanged) {
        data.latitude = geo?.latitude ?? null;
        data.longitude = geo?.longitude ?? null;
      }

      await ctx.db.$transaction([
        ctx.db.facility.update({ where: { id: facility.id }, data }),
        ctx.db.facilityChangeRequest.update({
          where: { id: request.id },
          data: { status: "APPROVED", reviewedAt: new Date() },
        }),
      ]);
      return { success: true as const };
    }),

  rejectFacilityChange: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.facilityChangeRequest.findUnique({
        where: { id: input.id },
      });
      if (!request || request.status !== "PENDING") {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.facilityChangeRequest.update({
        where: { id: input.id },
        data: { status: "REJECTED", reviewedAt: new Date() },
      });
    }),
});
