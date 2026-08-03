import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { withPhotoUrl } from "../r2";
import { protectedProcedure, router } from "../trpc";

export const favoriteRouter = router({
  // For heart-icon state across a grid of cards without a per-card query.
  myFacilityIds: protectedProcedure.query(async ({ ctx }) => {
    const favorites = await ctx.db.favorite.findMany({
      where: { userId: ctx.user.id },
      select: { facilityId: true },
    });
    return favorites.map((f) => f.facilityId);
  }),

  toggle: protectedProcedure
    .input(z.object({ facilityId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.favorite.findUnique({
        where: {
          userId_facilityId: { userId: ctx.user.id, facilityId: input.facilityId },
        },
      });

      if (existing) {
        await ctx.db.favorite.delete({ where: { id: existing.id } });
        return { favorited: false as const };
      }

      const facility = await ctx.db.facility.findUnique({
        where: { id: input.facilityId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
      }

      await ctx.db.favorite.create({
        data: { userId: ctx.user.id, facilityId: input.facilityId },
      });
      return { favorited: true as const };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const favorites = await ctx.db.favorite.findMany({
      where: { userId: ctx.user.id, facility: { status: "ACTIVE" } },
      include: {
        facility: {
          include: {
            capacities: true,
            photos: { take: 1, orderBy: { createdAt: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return favorites.map((f) => ({
      ...f.facility,
      photos: f.facility.photos.map(withPhotoUrl),
    }));
  }),
});
