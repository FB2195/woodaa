import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@woodaa/db";
import { verifyAccessToken } from "./auth";

/**
 * tRPC context. `token` is the caller's raw JWT access token, extracted by
 * whichever transport is in use (Fastify reads the Authorization header,
 * the Next.js web app reads an httpOnly cookie via next/headers) — kept out
 * of this shared package so it stays framework-agnostic. `ip` is similarly
 * extracted per-transport (Fastify's req.ip, the web app's x-forwarded-for
 * header) and only used by rateLimited below — null when unavailable.
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

// Simple in-memory per-IP rate limiter for public, unauthenticated
// lead-capture endpoints (e.g. waitlist.create) - a fixed window per
// "name:ip" key. MVP scope: state lives in this process's memory, so it
// resets on redeploy/restart and isn't shared across serverless instances
// (the Next.js web app's tRPC route runs on Vercel, not this long-lived
// process) - good enough to blunt casual scripted abuse of a public form,
// not a substitute for a real edge/WAF rate limiter if this becomes a
// target. ctx.ip is null when the transport couldn't determine one (e.g.
// local dev without a proxy) - those requests share a single "unknown"
// bucket rather than bypassing the limit entirely.
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimited(name: string, limit: number, windowMs: number) {
  return t.middleware(({ ctx, next }) => {
    const key = `${name}:${ctx.ip ?? "unknown"}`;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > limit) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Zu viele Anfragen. Bitte versuch es später noch einmal.",
        });
      }
    }
    return next();
  });
}
