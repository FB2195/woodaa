import * as Sentry from "@sentry/nextjs";

// Next.js's client-side instrumentation convention (auto-loaded into the
// browser bundle since Next.js 15.3, no next.config wrapping needed) -
// counterpart to sentry.server.config.ts/sentry.edge.config.ts, which only
// cover Server Components/Route Handlers/Server Actions. This is what
// catches an actual crash in a visitor's browser (e.g. mid-booking).
//
// Needs NEXT_PUBLIC_SENTRY_DSN, not SENTRY_DSN - only NEXT_PUBLIC_-prefixed
// env vars get inlined into the client bundle by Next.js, and a DSN is
// meant to be public (it only lets a client submit events, not read
// anything back) - same value as SENTRY_DSN works fine for both.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({ dsn, environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV });
}
