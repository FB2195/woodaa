import { TRPCError } from "@trpc/server";

// Simple in-memory fixed-window counter. This is real, effective
// protection for apps/api's Fastify process (a single long-lived Railway
// container) and best-effort on apps/web's Next.js route (Vercel
// serverless - a burst against one warm instance is caught, a sustained
// attack spread thin across many cold-started instances isn't). Still a
// large improvement over the previous zero rate limiting anywhere, and
// avoids pulling in a new Redis/Upstash dependency for v1. A shared store
// would close the remaining serverless gap if this ever needs to be
// airtight.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Lazy, traffic-triggered sweep of expired buckets so this map doesn't grow
// unbounded on the long-lived Fastify process - no separate timer needed.
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
function sweepExpired(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

// Throws TOO_MANY_REQUESTS once `key` has been called more than `limit`
// times within the trailing `windowMs` fixed window. `key` should already
// namespace the caller (e.g. `${procedureName}:${ip}`) - this module has no
// notion of what it's limiting.
export function checkRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  sweepExpired(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Zu viele Anfragen. Bitte versuche es in ein paar Minuten erneut.",
    });
  }
}
