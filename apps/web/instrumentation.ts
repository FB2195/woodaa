// Next.js's own instrumentation hook (not Sentry-specific) - runs once per
// runtime at server startup, before any request is handled. Used here only
// to conditionally load Sentry's server/edge config, which themselves no-op
// unless SENTRY_DSN is set.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
