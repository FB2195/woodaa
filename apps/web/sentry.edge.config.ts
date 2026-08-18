import * as Sentry from "@sentry/nextjs";

// Loaded from instrumentation.ts's register() hook (edge runtime only, e.g.
// middleware) - same conditional init as sentry.server.config.ts.
const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({ dsn, environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV });
}
