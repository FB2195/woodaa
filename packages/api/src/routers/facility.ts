import { TRPCError } from "@trpc/server";
import { FacilitySearchInput } from "@woodaa/validators";
import { z } from "zod";
import { searchLocations } from "../geocoding";
import { publicProcedure, router } from "../trpc";

export const facilityRouter = router({
  list: publicProcedure.input(FacilitySearchInput).query(async ({ ctx, input }) => {
    return ctx.db.facility.findMany({
      where: {
        status: "ACTIVE",
        // "city" is really "Ort oder PLZ" from the user's perspective - a
        // postal-code search like "10555" previously matched nothing at
        // all since only the city name was checked.
        ...(input.city
          ? {
              OR: [
                { city: { contains: input.city, mode: "insensitive" } },
                { postalCode: { startsWith: input.city } },
              ],
            }
          : {}),
        ...(input.bookingType
          ? {
              capacities: {
                some: { bookingType: input.bookingType, availableSlots: { gt: 0 } },
              },
            }
          : {}),
      },
      include: { capacities: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const facility = await ctx.db.facility.findUnique({
        where: { slug: input.slug, status: "ACTIVE" },
        include: {
          capacities: true,
          kurzzeitpflegeBookings: { orderBy: { startDate: "asc" } },
        },
      });

      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
      }

      return facility;
    }),

  searchLocations: publicProcedure
    .input(z.object({ query: z.string().trim().min(2) }))
    .query(async ({ input }) => searchLocations(input.query)),
});
