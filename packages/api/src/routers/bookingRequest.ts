import { TRPCError } from "@trpc/server";
import { CreateBookingRequestInput } from "@woodaa/validators";
import { publicProcedure, rateLimited, router } from "../trpc";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const CREATE_RATE_LIMIT = 10;

export const bookingRequestRouter = router({
  create: publicProcedure
    .use(rateLimited("bookingRequest.create", CREATE_RATE_LIMIT, RATE_LIMIT_WINDOW_MS))
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
          desiredEnd: input.desiredEnd ? new Date(input.desiredEnd) : undefined,
        },
      });
    }),
});
