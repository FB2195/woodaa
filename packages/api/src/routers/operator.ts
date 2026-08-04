import { TRPCError } from "@trpc/server";
import {
  AllowedPhotoContentType,
  CancelBookingInput,
  ConfirmPhotoUploadInput,
  CreateFacilityInput,
  CreateManualBookingInput,
  MAX_FACILITY_PHOTOS,
  RenameUnitInput,
  RequestPhotoUploadInput,
  SetUnitCountInput,
  UpdateFacilityInput,
  UpdatePricingInput,
} from "@woodaa/validators";
import { z } from "zod";
import { cancelBooking, createBooking, setUnitCount } from "../availability";
import { geocodeAddress } from "../geocoding";
import { slugify } from "../lib/slugify";
import { createPresignedUploadUrl, deleteObject, newPhotoKey, withPhotoUrl } from "../r2";
import { operatorProcedure, router } from "../trpc";
import type { Context } from "../trpc";

const PHOTO_CONTENT_TYPE_EXTENSION: Record<AllowedPhotoContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function requireOwnFacility(
  ctx: Context & { user: NonNullable<Context["user"]> },
) {
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

async function uniqueSlugFor(
  ctx: Context,
  name: string,
  city: string,
): Promise<string> {
  const base = slugify(`${name}-${city}`);
  let slug = base;
  let suffix = 1;
  while (await ctx.db.facility.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export const operatorRouter = router({
  myFacility: operatorProcedure.query(async ({ ctx }) => {
    const facility = await ctx.db.facility.findUnique({
      where: { operatorUserId: ctx.user.id },
      include: {
        capacities: true,
        photos: { orderBy: { createdAt: "asc" } },
        // All statuses, not just APPROVED - an operator should be able to
        // see reviews about their own facility regardless of moderation
        // state (no UI surfaces this yet, but the type needs the field).
        reviews: { orderBy: { createdAt: "desc" } },
        units: {
          orderBy: { createdAt: "asc" },
          include: {
            // Active bookings only - the manual booking page shows current
            // occupancy, not full history.
            bookings: { where: { status: "BESTAETIGT" }, orderBy: { createdAt: "desc" } },
          },
        },
      },
    });
    if (!facility) return null;
    return { ...facility, photos: facility.photos.map(withPhotoUrl) };
  }),

  createFacility: operatorProcedure
    .input(CreateFacilityInput)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.user.id },
      });
      if (!user.emailVerifiedAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bitte bestätige zuerst deine E-Mail-Adresse.",
        });
      }

      const existing = await ctx.db.facility.findUnique({
        where: { operatorUserId: ctx.user.id },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Du hast bereits eine Einrichtung angelegt.",
        });
      }

      const slug = await uniqueSlugFor(ctx, input.name, input.city);
      // Best-effort - a facility is still created even if geocoding fails
      // or Nominatim is unreachable, it just won't show on the map yet.
      const geo = await geocodeAddress(
        `${input.street}, ${input.postalCode} ${input.city}, Germany`,
      );

      return ctx.db.facility.create({
        data: {
          ...input,
          slug,
          status: "PENDING_REVIEW",
          operatorName: user.name,
          operatorEmail: user.email,
          operatorUserId: user.id,
          latitude: geo?.latitude ?? null,
          longitude: geo?.longitude ?? null,
        },
      });
    }),

  updateFacility: operatorProcedure
    .input(UpdateFacilityInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);

      const addressChanged =
        (input.street !== undefined && input.street !== facility.street) ||
        (input.postalCode !== undefined && input.postalCode !== facility.postalCode) ||
        (input.city !== undefined && input.city !== facility.city);

      // Only re-geocode when the address actually changed, to avoid
      // burning Nominatim requests on unrelated edits (e.g. description).
      const geo = addressChanged
        ? await geocodeAddress(
            `${input.street ?? facility.street}, ${input.postalCode ?? facility.postalCode} ${input.city ?? facility.city}, Germany`,
          )
        : null;

      return ctx.db.facility.update({
        where: { id: facility.id },
        data: {
          ...input,
          ...(addressChanged
            ? { latitude: geo?.latitude ?? null, longitude: geo?.longitude ?? null }
            : {}),
        },
      });
    }),

  // Nur Preis/availableFrom - totalSlots/availableSlots werden nie mehr
  // per Formular getippt, sondern ausschließlich von setUnitCount/
  // createManualBooking/cancelBooking über availability.ts gepflegt.
  updatePricing: operatorProcedure
    .input(UpdatePricingInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const availableFrom = input.availableFrom ? new Date(input.availableFrom) : null;

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
          monthlyPriceCents: input.monthlyPriceCents,
          availableFrom,
        },
        update: {
          monthlyPriceCents: input.monthlyPriceCents,
          availableFrom,
        },
      });
    }),

  // "Wie viele Plätze gibt es insgesamt in dieser Kategorie" - Erhöhen legt
  // anonyme neue Plätze an, Verringern entfernt nur Plätze ohne aktive
  // Buchung (siehe setUnitCount in availability.ts).
  setUnitCount: operatorProcedure
    .input(SetUnitCountInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      await ctx.db.$transaction((tx) =>
        setUnitCount(tx, facility.id, input.bookingType, input.totalUnits),
      );
      return { success: true };
    }),

  renameUnit: operatorProcedure
    .input(RenameUnitInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const unit = await ctx.db.facilityUnit.findUnique({ where: { id: input.unitId } });
      if (!unit || unit.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.facilityUnit.update({
        where: { id: input.unitId },
        data: { label: input.label },
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
  cancelBooking: operatorProcedure
    .input(CancelBookingInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      return cancelBooking(ctx.db, input.bookingId, { requireFacilityId: facility.id });
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

      const key = newPhotoKey(
        facility.id,
        PHOTO_CONTENT_TYPE_EXTENSION[input.contentType],
      );
      const uploadUrl = await createPresignedUploadUrl(key, input.contentType);
      return { uploadUrl, key };
    }),

  confirmPhotoUpload: operatorProcedure
    .input(ConfirmPhotoUploadInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      // No existence check against R2 by design - only reachable by the
      // authenticated owner of this exact facility, for a key they just
      // requested via requestPhotoUpload. A fabricated key just yields a
      // broken <img>, no cross-tenant risk.
      const photo = await ctx.db.facilityPhoto.create({
        data: { facilityId: facility.id, key: input.key },
      });
      return withPhotoUrl(photo);
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
});
