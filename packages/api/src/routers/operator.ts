import { TRPCError } from "@trpc/server";
import {
  AllowedPhotoContentType,
  ConfirmPhotoUploadInput,
  CreateFacilityInput,
  KurzzeitpflegeRangeInput,
  MAX_FACILITY_PHOTOS,
  RequestPhotoUploadInput,
  UpdateCapacityInput,
  UpdateFacilityInput,
} from "@woodaa/validators";
import { z } from "zod";
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
        kurzzeitpflegeBookings: { orderBy: { startDate: "asc" } },
        photos: { orderBy: { createdAt: "asc" } },
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

  updateCapacity: operatorProcedure
    .input(UpdateCapacityInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const availableFrom = input.availableFrom
        ? new Date(input.availableFrom)
        : null;

      return ctx.db.facilityCapacity.upsert({
        where: {
          facilityId_bookingType: {
            facilityId: facility.id,
            bookingType: input.bookingType,
          },
        },
        create: {
          facilityId: facility.id,
          bookingType: input.bookingType,
          totalSlots: input.totalSlots,
          availableSlots: input.availableSlots,
          monthlyPriceCents: input.monthlyPriceCents,
          availableFrom,
          weekdaySlots: input.weekdaySlots,
        },
        update: {
          totalSlots: input.totalSlots,
          availableSlots: input.availableSlots,
          monthlyPriceCents: input.monthlyPriceCents,
          availableFrom,
          weekdaySlots: input.weekdaySlots,
        },
      });
    }),

  addOccupiedRange: operatorProcedure
    .input(KurzzeitpflegeRangeInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      if (endDate <= startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Enddatum muss nach dem Startdatum liegen.",
        });
      }
      return ctx.db.kurzzeitpflegeBooking.create({
        data: { facilityId: facility.id, startDate, endDate },
      });
    }),

  removeOccupiedRange: operatorProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      const booking = await ctx.db.kurzzeitpflegeBooking.findUnique({
        where: { id: input.id },
      });
      if (!booking || booking.facilityId !== facility.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.kurzzeitpflegeBooking.delete({ where: { id: input.id } });
      return { success: true };
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
      await deleteObject(photo.key);
      await ctx.db.facilityPhoto.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
