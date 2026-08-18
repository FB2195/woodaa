import * as Sentry from "@sentry/nextjs";

// Loaded from instrumentation.ts's register() hook (Node runtime only) -
// stays a no-op until SENTRY_DSN is set, same "graceful no-op when
// unconfigured" pattern as stripeConfig.ts/googleMapsConfig.ts on the
// client side. Catches Server Component/Route Handler/Server Action
// errors that would otherwise only ever show up in hosting-provider logs
// nobody watches.
const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({ dsn, environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV });
}
