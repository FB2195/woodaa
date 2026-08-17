import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

// One token per row, upserted by value rather than by (userId, token) pair
// - a token is unique to a single device/app install, so if it somehow
// shows up under a different account (re-login on a shared device), the
// upsert re-points it instead of leaving a stale duplicate registered to
// the old user.
export const pushTokenRouter = router({
  register: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.pushToken.upsert({
        where: { token: input.token },
        create: { token: input.token, userId: ctx.user.id },
        update: { userId: ctx.user.id },
      });
      return { success: true as const };
    }),

  unregister: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.pushToken.deleteMany({ where: { token: input.token, userId: ctx.user.id } });
      return { success: true as const };
    }),
});
