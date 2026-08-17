import { TRPCError } from "@trpc/server";
import { CreateBookingRequestInput } from "@woodaa/validators";
import { sendOperatorNewBookingRequestEmail } from "../email";
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
        select: { id: true, name: true, operator: { select: { name: true, email: true } } },
      });

      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
      }

      const bookingRequest = await ctx.db.bookingRequest.create({
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

      // Best-effort, same "never block the mutation" treatment as every
      // other notification call site (see push.ts's sendPushNotification
      // comment) - without this, an operator with no linked login has no
      // way to learn a request came in at all (see operatorEmail below).
      if (facility.operator) {
        try {
          await sendOperatorNewBookingRequestEmail({
            to: facility.operator.email,
            operatorName: facility.operator.name,
            requesterName: input.requesterName,
            facilityName: facility.name,
            bookingType: input.bookingType,
          });
        } catch (err) {
          console.error("sendOperatorNewBookingRequestEmail failed", err);
        }
      }

      return bookingRequest;
    }),
});
