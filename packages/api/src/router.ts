import { accountRouter } from "./routers/account";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { bookingRouter } from "./routers/booking";
import { bookingRequestRouter } from "./routers/bookingRequest";
import { facilityRouter } from "./routers/facility";
import { favoriteRouter } from "./routers/favorite";
import { operatorRouter } from "./routers/operator";
import { reviewRouter } from "./routers/review";
import { twoFactorRouter } from "./routers/twoFactor";
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
  booking: bookingRouter,
  bookingRequest: bookingRequestRouter,
  operator: operatorRouter,
  admin: adminRouter,
  twoFactor: twoFactorRouter,
  account: accountRouter,
  favorite: favoriteRouter,
  review: reviewRouter,
});

export type AppRouter = typeof appRouter;
