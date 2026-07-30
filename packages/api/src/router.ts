import { bookingRequestRouter } from "./routers/bookingRequest";
import { facilityRouter } from "./routers/facility";
import { publicProcedure, router } from "./trpc";

/**
 * Root application router. Web and mobile import only this file's
 * `AppRouter` type for end-to-end type safety — never the implementation.
 */
export const appRouter = router({
  health: publicProcedure.query(async ({ ctx }) => {
    await ctx.db.$queryRaw`SELECT 1`;
    return { status: "ok" as const };
  }),
  facility: facilityRouter,
  bookingRequest: bookingRequestRouter,
});

export type AppRouter = typeof appRouter;
