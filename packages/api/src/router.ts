import { authRouter } from "./routers/auth";
import { bookingRequestRouter } from "./routers/bookingRequest";
import { facilityRouter } from "./routers/facility";
import { operatorRouter } from "./routers/operator";
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
  auth: authRouter,
  facility: facilityRouter,
  bookingRequest: bookingRequestRouter,
  operator: operatorRouter,
});

export type AppRouter = typeof appRouter;
