import { TRPCError } from "@trpc/server";
import {
  CreateFacilityInput,
  KurzzeitpflegeRangeInput,
  UpdateCapacityInput,
  UpdateFacilityInput,
} from "@woodaa/validators";
import { z } from "zod";
import { slugify } from "../lib/slugify";
import { operatorProcedure, router } from "../trpc";
import type { Context } from "../trpc";

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
    return ctx.db.facility.findUnique({
      where: { operatorUserId: ctx.user.id },
      include: {
        capacities: true,
        kurzzeitpflegeBookings: { orderBy: { startDate: "asc" } },
      },
    });
  }),

  createFacility: operatorProcedure
    .input(CreateFacilityInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.facility.findUnique({
        where: { operatorUserId: ctx.user.id },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Du hast bereits eine Einrichtung angelegt.",
        });
      }

      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.user.id },
      });
      const slug = await uniqueSlugFor(ctx, input.name, input.city);

      return ctx.db.facility.create({
        data: {
          ...input,
          slug,
          status: "PENDING_REVIEW",
          operatorName: user.name,
          operatorEmail: user.email,
          operatorUserId: user.id,
        },
      });
    }),

  updateFacility: operatorProcedure
    .input(UpdateFacilityInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await requireOwnFacility(ctx);
      return ctx.db.facility.update({
        where: { id: facility.id },
        data: input,
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
          availableFrom,
          weekdaySlots: input.weekdaySlots,
        },
        update: {
          totalSlots: input.totalSlots,
          availableSlots: input.availableSlots,
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
});
