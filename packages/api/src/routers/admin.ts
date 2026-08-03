import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { withPhotoUrl } from "../r2";
import { adminProcedure, router } from "../trpc";

export const adminRouter = router({
  pendingFacilities: adminProcedure.query(async ({ ctx }) => {
    const facilities = await ctx.db.facility.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        capacities: true,
        photos: { take: 1, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });
    return facilities.map((f) => ({ ...f, photos: f.photos.map(withPhotoUrl) }));
  }),

  activeFacilities: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.facility.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
  }),

  approveFacility: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await ctx.db.facility.findUnique({ where: { id: input.id } });
      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.facility.update({
        where: { id: input.id },
        data: { status: "ACTIVE" },
      });
    }),

  rejectFacility: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const facility = await ctx.db.facility.findUnique({ where: { id: input.id } });
      if (!facility) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.facility.update({
        where: { id: input.id },
        data: { status: "REJECTED" },
      });
    }),
});
