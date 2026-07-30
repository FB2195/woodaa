import { publicProcedure, router } from "./trpc";

/**
 * Root application router. Web and mobile import only this file's
 * `AppRouter` type for end-to-end type safety — never the implementation.
 * Phase 1 adds facilities/search/booking routers here.
 */
export const appRouter = router({
  health: publicProcedure.query(async ({ ctx }) => {
    const check = await ctx.db.healthCheck.findFirst({
      orderBy: { createdAt: "desc" },
    });
    return { status: "ok" as const, lastCheck: check?.createdAt ?? null };
  }),
});

export type AppRouter = typeof appRouter;
