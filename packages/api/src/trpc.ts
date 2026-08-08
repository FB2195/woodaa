import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@woodaa/db";
import { verifyAccessToken } from "./auth";
import { checkRateLimit } from "./rateLimit";

/**
 * tRPC context. `token` is the caller's raw JWT access token, extracted by
 * whichever transport is in use (Fastify reads the Authorization header,
 * the Next.js web app reads an httpOnly cookie via next/headers) — kept out
 * of this shared package so it stays framework-agnostic. `ip` is the same
 * story: each transport resolves its own client IP (Fastify's req.ip,
 * Next's x-forwarded-for) and passes it in here for rateLimited() below.
 */
export function createContext(opts?: { token?: string | null; ip?: string | null }) {
  const payload = opts?.token ? verifyAccessToken(opts.token) : null;
  const user = payload ? { id: payload.sub, role: payload.role } : null;
  return { db, user, ip: opts?.ip ?? null };
}
export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Per-IP fixed-window limit for a publicProcedure - see rateLimit.ts for
// what this can and can't guarantee. Keyed by `name` (unique per call site)
// plus the caller's IP, so unrelated endpoints never share a bucket. Falls
// back to a shared "unknown" bucket if the transport couldn't resolve an
// IP, rather than skipping the check entirely.
export function rateLimited(name: string, limit: number, windowMs: number) {
  return t.middleware(({ ctx, next }) => {
    checkRateLimit(`${name}:${ctx.ip ?? "unknown"}`, limit, windowMs);
    return next();
  });
}

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

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const adminProcedure = t.procedure.use(isAdmin);
