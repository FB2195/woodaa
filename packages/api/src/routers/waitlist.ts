import { TRPCError } from "@trpc/server";
import { CreateWaitlistEntryInput } from "@woodaa/validators";
import { publicProcedure, rateLimited, router } from "../trpc";

export const waitlistRouter = router({
  // Mirrors bookingRequest.create closely (public lead-capture, no login,
  // facility-must-be-ACTIVE check) - see WaitlistEntry in schema.prisma.
  create: publicProcedure
    .use(rateLimited("waitlist.create", 10, 60 * 60 * 1000))
    .input(CreateWaitlistEntryInput)
    .mutation(async ({ ctx, input }) => {
      const facility = await ctx.db.facility.findUnique({
        where: { id: input.facilityId, status: "ACTIVE" },
        select: { id: true },
      });

      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
      }

      return ctx.db.waitlistEntry.create({
        data: {
          facilityId: input.facilityId,
          bookingType: input.bookingType,
          name: input.name,
          email: input.email,
          phone: input.phone,
          pflegegrad: input.pflegegrad,
          message: input.message,
        },
      });
    }),
});
