import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@woodaa/db";
import { verifyAccessToken } from "./auth";

/**
 * tRPC context. `token` is the caller's raw JWT access token, extracted by
 * whichever transport is in use (Fastify reads the Authorization header,
 * the Next.js web app reads an httpOnly cookie via next/headers) — kept out
 * of this shared package so it stays framework-agnostic.
 */
export function createContext(opts?: { token?: string | null }) {
  const payload = opts?.token ? verifyAccessToken(opts.token) : null;
  const user = payload ? { id: payload.sub, role: payload.role } : null;
  return { db, user };
}
export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const protectedProcedure = t.procedure.use(isAuthed);

const isOperator = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "BETREIBER") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const operatorProcedure = t.procedure.use(isOperator);
