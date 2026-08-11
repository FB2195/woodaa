import { TRPCError } from "@trpc/server";
import {
  AllowedPhotoContentType,
  BookingPaymentApprovalInput,
  CancelBookingInput,
  ConfirmPhotoUploadInput,
  CreateFacilityInput,
  CreateEmployeeInput,
  CreateFacilityTaskInput,
  CreateHandoverNoteInput,
  CreateManualBookingInput,
  CreateResidentNoteInput,
  MAX_FACILITY_PHOTOS,
  MAX_PHOTO_BYTES,
  ReplyToReviewInput,
  RequestFacilityChangeInput,
  RequestPhotoUploadInput,
  SetEmployeeShiftInput,
  SetPflegegradPricingInput,
  SetUnitCountInput,
  UpdateEmployeeInput,
  UpdateFacilityInput,
  UpdatePricingInput,
  UpdateUnitInput,
} from "@woodaa/validators";
import { z } from "zod";
import { cancelBooking, createBooking, setUnitCount } from "../availability";
import { resolveBookingRecipient, sendBookingFacilityDecisionEmail } from "../email";
import { createFacilityForOperator } from "../lib/facility";
import { cheapestMonthlyEquivalentCents } from "../pricing";
import {
  createPresignedDownloadUrl,
  createPresignedUploadUrl,
  deleteObject,
  headUploadedObjectSize,
  newPhotoKey,
  withPhotoUrl,
} from "../r2";
import { refundBookingPayment } from "../stripe";
import { operatorProcedure, router } from "../trpc";
import type { Context } from "../trpc";

const PHOTO_CONTENT_TYPE_EXTENSION: Record<AllowedPhotoContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function requireOwnFacility(ctx: Context & { user: NonNullable<Context["user"]> }) {
  const facility = await ctx.db.facility.findUnique({
    where: { operatorUserId: ctx.user.id },
  });
  if (!facility) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Du hast noch keine Einrichtung angelegt.",
    });
  }
  return facility;
}

export const operatorRouter = router({
  myFacility: operatorProcedure.query(async ({ ctx }) => {
    const facility = await ctx.db.facility.findUnique({
      where: { operatorUserId: ctx.user.id },
      include: {
        capacities: { include: { pflegegradPricing: true } },
        photos: { orderBy: { createdAt: "asc" } },
        changeRequests: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        // All statuses, not just APPROVED - an operator should be able to
        // see reviews about their own facility regardless of moderation
        // state (no UI surfaces this yet, but the type needs the field).
        reviews: { orderBy: { createdAt: "desc" } },
        units: {
          orderBy: { createdAt: "asc" },
          include: {
            // Active bookings only - the manual booking page shows current
            // occupancy, not full history. user.vollmachtDocumentKey flags
            // bookings from a Bevollmächtigte/r Angehörige/r account (see
            // FacilityWithOperatorDetails in @woodaa/db).
            bookings: {
              where: { status: "BESTAETIGT" },
              orderBy: { createdAt: "desc" },
              include: { user: { select: { vollmachtDocumentKey: true } } },
            },
          },
        },
      },
    });
    if (!facility) return null;
    const { changeRequests, ...rest } = facility;
    return {
      ...rest,
      photos: facility.photos.map(withPhotoUrl),
      pendingChangeRequest: changeRequests[0] ?? null,
    };
  }),

  // Staff-visibility list, same "no UI action yet, just surface it" spirit
  // as the reviews include above - lets an operator see who's waiting for a
  // spot to free up. notifyWaitlist (availability.ts) is the only writer of
  // notifiedAt; there's no manual "mark contacted" action here yet (MVP
  // scope, see the comment on WaitlistEntry in schema.prisma).
  waitlistEntries: operatorProcedure.query(async ({ ctx }) => {
    const facility = await requireOwnFacility(ctx);
    return ctx.db.waitlistEntry.findMany({
      where: { facilityId: facility.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  createFacility: operatorProcedure.input(CreateFacilityInput).mutation(async ({ ctx, input }) => {
    // No email-verification gate here on purpose - the free availability
    // tool should be usable immediately after signup. Verification is
    // required later, at requestPublicListing, where it actually matters
    // (a real address going out to families searching woodaa).
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
    });

    const existing = await ctx.db.facility.findUnique({
      where: { operatorUserId: ctx.user.id },
    });
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Du hast bereits eine Einrichtung angelegt.",
      });
    }

    return createFacilityForOperator(ctx.db, user, input);
  }),

  // Non-critical fields only (description, amenities, Pflegegrad-Eignung,
  // Unterkunftsrichtlinien) - applies immediately. Name/address/operator
  // contact details are trust-sensitive and go through requestFacilityChange
  // + admin approval instead (see RequestFacilityChangeInput).
  updateFacility: operatorProcedure.input(UpdateFacilityInput).mutation(async ({ ctx, input }) => {
    const facility = await requireOwnFacility(ctx);

    // Going from no description to having one is the "request public
    // listing" moment (see PublicListingPrompt.tsx / admin.pendingFacilities'
    // description-not-empty filter) - that's the one action that actually
    // needs a confirmed email, since it puts a real address in front of
    // families searching woodaa.
    if (!facility.description && input.description) {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.user.id },
      });
      if (!user.emailVerifiedAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Bitte bestätige zuerst deine E-Mail-Adresse, bevor deine Einrichtung öffentlich sichtbar wird.",
        });
      }
    }

    return ctx.db.facility.update({
      where: { id: facility.id },
      data: input,
    });
  }),

  // Nicht-kritisch (wie updateFacility oben) - wirkt sich nur auf künftig
  // erstellte Buchungen aus, kein admin-approval-Gate nötig.
  updateBookingApprovalMode: operatorProcedure
    .input(z.object({ mode: z.enum(["AUTOMATISCH", "MANUELL"]) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      return ctx.db.facility.update({
        where: { id: facility.id },
        data: { bookingApprovalMode: input.mode },
      });
    }),

  // Proposes new values for the critical fields (name, address, operator
  // contact) - doesn't touch Facility directly, just creates/overwrites the
  // one PENDING FacilityChangeRequest for this facility. The old values stay
  // live until an admin approves it (see admin.approveFacilityChangeRequest).
  requestFacilityChange: operatorProcedure
    .input(RequestFacilityChangeInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);

      const existing = await ctx.db.facilityChangeRequest.findFirst({
        where: { facilityId: facility.id, status: "PENDING" },
      });
      if (existing) {
        return ctx.db.facilityChangeRequest.update({
          where: { id: existing.id },
          data: input,
        });
      }
      return ctx.db.facilityChangeRequest.create({
        data: { ...input, facilityId: facility.id },
      });
    }),

  // Lets the operator withdraw their own pending change before an admin
  // reviews it (e.g. to fix a typo without waiting it out).
  cancelFacilityChangeRequest: operatorProcedure.mutation(async ({ ctx }) => {
    const facility = await requireOwnFacility(ctx);
    await ctx.db.facilityChangeRequest.deleteMany({
      where: { facilityId: facility.id, status: "PENDING" },
    });
    return { success: true as const };
  }),

  // Nur availableFrom - totalSlots/availableSlots werden nie mehr per
  // Formular getippt, sondern ausschließlich von setUnitCount/
  // createManualBooking/cancelBooking über availability.ts gepflegt.
  // monthlyPriceCents ist kein Formularfeld mehr - siehe
  // setPflegegradPricing, das es automatisch aus den echten
  // Pflegegrad-Sätzen herleitet.
  updatePricing: operatorProcedure.input(UpdatePricingInput).mutation(async ({ ctx, input }) => {
    const facility = await requireOwnFacility(ctx);
    const availableFrom = input.availableFrom ? new Date(input.availableFrom) : null;
    const minStayNights = input.minStayNights ?? null;

    return ctx.db.facilityCapacity.upsert({
      where: {
        facilityId_bookingType: { facilityId: facility.id, bookingType: input.bookingType },
      },
      // 0/0 on first create - a real count only exists once setUnitCount
      // has run at least once; the pricing form can be filled in first.
      create: {
        facilityId: facility.id,
        bookingType: input.bookingType,
        totalSlots: 0,
        availableSlots: 0,
        availableFrom,
        minStayNights,
      },
      update: {
        availableFrom,
        minStayNights,
      },
    });
  }),

  // Real per-Pflegegrad rates - the actual basis for every Eigenanteil/
  // Zuschuss calculation, see CapacityPflegegradPricing in schema.prisma.
  // Always resubmits every row for this bookingType (the operator UI is
  // one table per category), so this both creates/updates and clears rows
  // whose Pflegegrad isn't present in the new `rates` array. Also
  // recomputes FacilityCapacity.monthlyPriceCents as the cheapest of these
  // rates (see cheapestMonthlyEquivalentCents) - the single "ab X €/Monat"
  // figure search result cards show, kept derived rather than a second
  // manually-typed number that could drift out of sync with the real
  // per-Pflegegrad prices below it.
  setPflegegradPricing: operatorProcedure
    .input(SetPflegegradPricingInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);

      const capacity = await ctx.db.facilityCapacity.upsert({
        where: {
          facilityId_bookingType: { facilityId: facility.id, bookingType: input.bookingType },
        },
        create: {
          facilityId: facility.id,
          bookingType: input.bookingType,
          totalSlots: 0,
          availableSlots: 0,
        },
        update: {},
      });

      const monthlyPriceCents = cheapestMonthlyEquivalentCents(
        input.bookingType,
        input.rates.map((rate) => ({
          dailyRateCents: rate.dailyRateCents ?? null,
          monthlyRateCents: rate.monthlyRateCents ?? null,
          hourlyRateCents: rate.hourlyRateCents ?? null,
        })),
      );

      await ctx.db.$transaction([
        ctx.db.facilityCapacity.update({
          where: { id: capacity.id },
          data: { monthlyPriceCents },
        }),
        ctx.db.capacityPflegegradPricing.deleteMany({
          where: {
            capacityId: capacity.id,
            pflegegrad: { notIn: input.rates.map((r) => r.pflegegrad) },
          },
        }),
        ...input.rates.map((rate) =>
          ctx.db.capacityPflegegradPricing.upsert({
            where: {
              capacityId_pflegegrad: { capacityId: capacity.id, pflegegrad: rate.pflegegrad },
            },
            create: {
              capacityId: capacity.id,
              pflegegrad: rate.pflegegrad,
              dailyRateCents: rate.dailyRateCents ?? null,
              monthlyRateCents: rate.monthlyRateCents ?? null,
              hourlyRateCents: rate.hourlyRateCents ?? null,
            },
            update: {
              dailyRateCents: rate.dailyRateCents ?? null,
              monthlyRateCents: rate.monthlyRateCents ?? null,
              hourlyRateCents: rate.hourlyRateCents ?? null,
            },
          }),
        ),
      ]);

      return { success: true };
    }),

  // "Wie viele Plätze gibt es insgesamt in dieser Kategorie" - Erhöhen legt
  // anonyme neue Plätze an, Verringern entfernt nur Plätze ohne aktive
  // Buchung (siehe setUnitCount in availability.ts).
  setUnitCount: operatorProcedure.input(SetUnitCountInput).mutation(async ({ ctx, input }) => {
    const facility = await requireOwnFacility(ctx);
    await ctx.db.$transaction((tx) =>
      setUnitCount(tx, facility.id, input.bookingType, input.totalUnits),
    );
    return { success: true };
  }),

  updateUnit: operatorProcedure.input(UpdateUnitInput).mutation(async ({ ctx, input }) => {
    const facility = await requireOwnFacility(ctx);
    const unit = await ctx.db.facilityUnit.findUnique({ where: { id: input.unitId } });
    if (!unit || unit.facilityId !== facility.id) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return ctx.db.facilityUnit.update({
      where: { id: input.unitId },
      data: {
        label: input.label,
        ...(input.isIntensivpflege !== undefined
          ? { isIntensivpflege: input.isIntensivpflege }
          : {}),
      },
    });
  }),

  // Für Telefon-/Vor-Ort-Buchungen: ein Klick pro Kategorie, das System
  // weist automatisch einen freien Platz zu (siehe createBooking) - Personal
  // muss nicht wissen/wählen, welcher Platz konkret belegt wird.
  createManualBooking: operatorProcedure
    .input(CreateManualBookingInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      return createBooking(ctx.db, {
        facilityId: facility.id,
        bookingType: input.bookingType,
        source: input.source,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        note: input.note,
      });
    }),

  // Storniert jede Buchung der eigenen Einrichtung, unabhängig von der
  // Quelle - auch eine online sofort verbindliche Buchung, falls die
  // Einrichtung sie im Nachhinein doch nicht annehmen kann.
  cancelBooking: operatorProcedure.input(CancelBookingInput).mutation(async ({ ctx, input }) => {
    const facility = await requireOwnFacility(ctx);
    const booking = await cancelBooking(ctx.db, input.bookingId, {
      requireFacilityId: facility.id,
    });
    await refundBookingPayment(ctx.db, booking);
    return booking;
  }),

  // Für Buchungen mit facilityApprovalStatus=AUSSTEHEND (bookingApprovalMode
  // war MANUELL zum Buchungszeitpunkt) - unabhängig vom Zahlungsstatus/
  // adminApprovalStatus, siehe BookingFacilityApprovalStatus in schema.prisma.
  confirmBooking: operatorProcedure
    .input(z.object({ bookingId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: { user: true },
      });
      if (!booking || booking.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buchung nicht gefunden." });
      }
      const updated = await ctx.db.booking.update({
        where: { id: booking.id },
        data: { facilityApprovalStatus: "BESTAETIGT", facilityDecisionAt: new Date() },
      });
      if (booking.user) {
        const { to, recipientName } = resolveBookingRecipient(booking.user);
        await sendBookingFacilityDecisionEmail({
          to,
          recipientName,
          guestName: `${booking.guestFirstName ?? ""} ${booking.guestLastName ?? ""}`.trim(),
          facilityName: facility.name,
          facilitySlug: facility.slug,
          bookingType: booking.bookingType,
          decision: "BESTAETIGT",
        });
      }
      return updated;
    }),

  // Storniert die Buchung gleich mit (wie rejectBookingPayment unten) - ohne
  // Annahme durch die Einrichtung darf der Platz nicht länger blockiert
  // bleiben, eine eventuell bereits erfolgte Zahlung wird erstattet.
  rejectBooking: operatorProcedure
    .input(z.object({ bookingId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: { user: true },
      });
      if (!booking || booking.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buchung nicht gefunden." });
      }
      await ctx.db.booking.update({
        where: { id: booking.id },
        data: { facilityApprovalStatus: "ABGELEHNT", facilityDecisionAt: new Date() },
      });
      const cancelled = await cancelBooking(ctx.db, booking.id, {
        requireFacilityId: facility.id,
      });
      await refundBookingPayment(ctx.db, cancelled);
      if (booking.user) {
        const { to, recipientName } = resolveBookingRecipient(booking.user);
        await sendBookingFacilityDecisionEmail({
          to,
          recipientName,
          guestName: `${booking.guestFirstName ?? ""} ${booking.guestLastName ?? ""}`.trim(),
          facilityName: facility.name,
          facilitySlug: facility.slug,
          bookingType: booking.bookingType,
          decision: "ABGELEHNT",
        });
      }
      return cancelled;
    }),

  // RECHNUNG/KOSTENUEBERNAHME_KASSE-Buchungen brauchen das "Go" des Heims,
  // bevor sie als zahlungsbestätigt gelten - das Heim trägt bei RECHNUNG das
  // Ausfallrisiko selbst bzw. bestätigt bei KOSTENUEBERNAHME_KASSE, dass der
  // hochgeladene Beleg plausibel ist.
  approveBookingPayment: operatorProcedure
    .input(BookingPaymentApprovalInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const booking = await ctx.db.booking.findUnique({ where: { id: input.bookingId } });
      if (!booking || booking.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buchung nicht gefunden." });
      }
      return ctx.db.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "FREIGEGEBEN", facilityApprovedAt: new Date() },
      });
    }),

  // Storniert die Buchung gleich mit - ohne Freigabe gibt es keinen
  // gültigen Zahlungsweg mehr, der Platz darf nicht länger blockiert bleiben.
  rejectBookingPayment: operatorProcedure
    .input(BookingPaymentApprovalInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: { user: true },
      });
      if (!booking || booking.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buchung nicht gefunden." });
      }
      await ctx.db.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "ABGELEHNT" },
      });
      const cancelled = await cancelBooking(ctx.db, booking.id, {
        requireFacilityId: facility.id,
      });
      if (booking.user) {
        const { to, recipientName } = resolveBookingRecipient(booking.user);
        await sendBookingFacilityDecisionEmail({
          to,
          recipientName,
          guestName: `${booking.guestFirstName ?? ""} ${booking.guestLastName ?? ""}`.trim(),
          facilityName: facility.name,
          facilitySlug: facility.slug,
          bookingType: booking.bookingType,
          decision: "ABGELEHNT",
          rejectionSource: "ZAHLUNG",
        });
      }
      return cancelled;
    }),

  kostenuebernahmeDownloadUrl: operatorProcedure
    .input(BookingPaymentApprovalInput)
    .query(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const booking = await ctx.db.booking.findUnique({ where: { id: input.bookingId } });
      if (!booking || booking.facilityId !== facility.id || !booking.kostenuebernahmeDocumentKey) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return { url: await createPresignedDownloadUrl(booking.kostenuebernahmeDocumentKey) };
    }),

  requestPhotoUpload: operatorProcedure
    .input(RequestPhotoUploadInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);

      const count = await ctx.db.facilityPhoto.count({
        where: { facilityId: facility.id },
      });
      if (count >= MAX_FACILITY_PHOTOS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximal ${MAX_FACILITY_PHOTOS} Fotos pro Einrichtung.`,
        });
      }

      const key = newPhotoKey(facility.id, PHOTO_CONTENT_TYPE_EXTENSION[input.contentType]);
      const uploadUrl = await createPresignedUploadUrl(key, input.contentType);
      return { uploadUrl, key };
    }),

  confirmPhotoUpload: operatorProcedure
    .input(ConfirmPhotoUploadInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      // Only reachable by the authenticated owner of this exact facility,
      // for a key they just requested via requestPhotoUpload - a fabricated
      // key just yields no object below, no cross-tenant read/write risk.
      // What the presigned PUT itself can't enforce upfront is the byte
      // size (see createPresignedUploadUrl) - checked here instead, against
      // the object that's now actually sitting in R2.
      const size = await headUploadedObjectSize(input.key);
      if (size === null || size > MAX_PHOTO_BYTES) {
        await deleteObject(input.key);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            size === null
              ? "Upload nicht gefunden."
              : `Datei überschreitet die maximale Größe von ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)} MB.`,
        });
      }
      const photo = await ctx.db.facilityPhoto.create({
        data: { facilityId: facility.id, key: input.key },
      });
      return withPhotoUrl(photo);
    }),

  // Booking.com-style host response - writes or overwrites the one reply
  // this facility has on a review (see the comment on Review.operatorReply
  // in schema.prisma for why this needs no separate admin-approval step).
  replyToReview: operatorProcedure.input(ReplyToReviewInput).mutation(async ({ ctx, input }) => {
    const facility = await requireOwnFacility(ctx);
    const review = await ctx.db.review.findUnique({ where: { id: input.reviewId } });
    if (!review || review.facilityId !== facility.id) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Bewertung nicht gefunden." });
    }
    return ctx.db.review.update({
      where: { id: review.id },
      data: { operatorReply: input.reply, operatorRepliedAt: new Date() },
    });
  }),

  removePhoto: operatorProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const photo = await ctx.db.facilityPhoto.findUnique({
        where: { id: input.id },
      });
      if (!photo || photo.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      // key is null for designed placeholder rows (seed data) - nothing to
      // delete from R2 in that case, just remove the row.
      if (photo.key) {
        await deleteObject(photo.key);
      }
      await ctx.db.facilityPhoto.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // "Bewohner:innen" area (apps/desktop) - all notes across the facility's
  // bookings in one call rather than one query per resident, since the UI
  // renders a note count/list per unit alongside the same units/bookings
  // myFacility already returns.
  residentNotes: operatorProcedure.query(async ({ ctx }) => {
    const facility = await requireOwnFacility(ctx);
    return ctx.db.residentNote.findMany({
      where: { booking: { facilityId: facility.id } },
      orderBy: { createdAt: "desc" },
    });
  }),

  addResidentNote: operatorProcedure
    .input(CreateResidentNoteInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const booking = await ctx.db.booking.findUnique({ where: { id: input.bookingId } });
      if (!booking || booking.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buchung nicht gefunden." });
      }
      return ctx.db.residentNote.create({
        data: { bookingId: input.bookingId, body: input.body },
      });
    }),

  removeResidentNote: operatorProcedure
    .input(z.object({ noteId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const note = await ctx.db.residentNote.findUnique({
        where: { id: input.noteId },
        include: { booking: { select: { facilityId: true } } },
      });
      if (!note || note.booking.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.residentNote.delete({ where: { id: input.noteId } });
      return { success: true };
    }),

  // "Team" area (apps/desktop) - a plain per-facility to-do list.
  tasks: operatorProcedure.query(async ({ ctx }) => {
    const facility = await requireOwnFacility(ctx);
    return ctx.db.facilityTask.findMany({
      where: { facilityId: facility.id },
      orderBy: [{ completedAt: "asc" }, { createdAt: "desc" }],
    });
  }),

  addTask: operatorProcedure.input(CreateFacilityTaskInput).mutation(async ({ ctx, input }) => {
    const facility = await requireOwnFacility(ctx);
    return ctx.db.facilityTask.create({
      data: { facilityId: facility.id, title: input.title },
    });
  }),

  toggleTask: operatorProcedure
    .input(z.object({ taskId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const task = await ctx.db.facilityTask.findUnique({ where: { id: input.taskId } });
      if (!task || task.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.facilityTask.update({
        where: { id: input.taskId },
        data: { completedAt: task.completedAt ? null : new Date() },
      });
    }),

  removeTask: operatorProcedure
    .input(z.object({ taskId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const task = await ctx.db.facilityTask.findUnique({ where: { id: input.taskId } });
      if (!task || task.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.facilityTask.delete({ where: { id: input.taskId } });
      return { success: true };
    }),

  // "Team" area (apps/desktop) - an append-only Übergabe/handover feed, see
  // HandoverNote in schema.prisma for why there's no edit/delete here.
  handoverNotes: operatorProcedure.query(async ({ ctx }) => {
    const facility = await requireOwnFacility(ctx);
    return ctx.db.handoverNote.findMany({
      where: { facilityId: facility.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }),

  addHandoverNote: operatorProcedure
    .input(CreateHandoverNoteInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      return ctx.db.handoverNote.create({
        data: { facilityId: facility.id, body: input.body },
      });
    }),

  // "Personal" area (apps/desktop) - see the comment on Employee in
  // schema.prisma for why this stays a roster the one facility login
  // manages, not individual staff accounts.
  employees: operatorProcedure.query(async ({ ctx }) => {
    const facility = await requireOwnFacility(ctx);
    return ctx.db.employee.findMany({
      where: { facilityId: facility.id },
      include: { shifts: true },
      orderBy: { createdAt: "asc" },
    });
  }),

  addEmployee: operatorProcedure.input(CreateEmployeeInput).mutation(async ({ ctx, input }) => {
    const facility = await requireOwnFacility(ctx);
    return ctx.db.employee.create({
      data: {
        facilityId: facility.id,
        name: input.name,
        role: input.role,
        phone: input.phone,
        email: input.email,
      },
    });
  }),

  updateEmployee: operatorProcedure.input(UpdateEmployeeInput).mutation(async ({ ctx, input }) => {
    const facility = await requireOwnFacility(ctx);
    const employee = await ctx.db.employee.findUnique({ where: { id: input.employeeId } });
    if (!employee || employee.facilityId !== facility.id) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return ctx.db.employee.update({
      where: { id: input.employeeId },
      data: {
        name: input.name,
        role: input.role,
        phone: input.phone ?? null,
        email: input.email ?? null,
        active: input.active,
      },
    });
  }),

  removeEmployee: operatorProcedure
    .input(z.object({ employeeId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const employee = await ctx.db.employee.findUnique({ where: { id: input.employeeId } });
      if (!employee || employee.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.employee.delete({ where: { id: input.employeeId } });
      return { success: true };
    }),

  // Upsert by design (@@unique([employeeId, weekday])) - setting a day that
  // already has a label just overwrites it, rather than needing a separate
  // "edit" mutation.
  setShift: operatorProcedure.input(SetEmployeeShiftInput).mutation(async ({ ctx, input }) => {
    const facility = await requireOwnFacility(ctx);
    const employee = await ctx.db.employee.findUnique({ where: { id: input.employeeId } });
    if (!employee || employee.facilityId !== facility.id) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return ctx.db.employeeShift.upsert({
      where: { employeeId_weekday: { employeeId: input.employeeId, weekday: input.weekday } },
      create: { employeeId: input.employeeId, weekday: input.weekday, label: input.label },
      update: { label: input.label },
    });
  }),

  removeShift: operatorProcedure
    .input(z.object({ shiftId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const shift = await ctx.db.employeeShift.findUnique({
        where: { id: input.shiftId },
        include: { employee: { select: { facilityId: true } } },
      });
      if (!shift || shift.employee.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.employeeShift.delete({ where: { id: input.shiftId } });
      return { success: true };
    }),
});
