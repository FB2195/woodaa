import * as Sentry from "@sentry/node";

// Initialized once from apps/api/src/index.ts (the one long-lived process
// in this stack) if SENTRY_DSN is set - stays a no-op otherwise, same
// "graceful no-op when unconfigured" pattern as stripeConfig.ts/
// googleMapsConfig.ts on the client side. Sentry's own SDK already no-ops
// captureException calls made before init()/without a DSN, so nothing here
// needs to branch on whether Sentry is actually active.
export function initErrorReporting(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, environment: process.env.NODE_ENV ?? "development" });
}

// Every "best-effort, never let this block the caller" catch block in this
// codebase (a failed email send, a failed push notification, ...) used to
// only console.error and move on - real, meaning the failure was
// invisible outside server logs nobody watches. This keeps that same
// console.error (useful in local dev, and Sentry can be down/unconfigured)
// but also reports it to Sentry when configured, so these no-longer
// silently vanish in production. `context` becomes Sentry's structured
// "extra" data - pass whatever identifies the failed operation (a booking
// id, a recipient address, ...).
export function reportError(
  err: unknown,
  message: string,
  context?: Record<string, unknown>,
): void {
  console.error(message, context ?? "", err);
  Sentry.captureException(err, { extra: { message, ...context } });
}
