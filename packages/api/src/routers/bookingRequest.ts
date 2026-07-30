import { TRPCError } from "@trpc/server";
import { CreateBookingRequestInput } from "@woodaa/validators";
import { publicProcedure, router } from "../trpc";

export const bookingRequestRouter = router({
  create: publicProcedure
    .input(CreateBookingRequestInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await ctx.db.facility.findUnique({
        where: { id: input.facilityId, status: "ACTIVE" },
        select: { id: true },
      });

      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
      }

      return ctx.db.bookingRequest.create({
        data: {
          facilityId: input.facilityId,
          bookingType: input.bookingType,
          requesterName: input.requesterName,
          requesterEmail: input.requesterEmail,
          requesterPhone: input.requesterPhone,
          pflegegrad: input.pflegegrad,
          message: input.message,
          desiredStart: input.desiredStart ? new Date(input.desiredStart) : undefined,
        },
      });
    }),
});
