// Inlined at build time by Expo (EXPO_PUBLIC_ prefix) - see .env.example.
//
// Points at apps/web, not the standalone apps/api Fastify server: apps/web
// already runs the same tRPC router in-process via a Next.js route handler
// (see apps/web/app/api/trpc/[trpc]/route.ts) and is the only one of the
// two actually deployed today. That route accepts a Bearer access token as
// well as its usual browser cookie, so the mobile app can talk to it
// directly - no separate API deployment needed. Falls back to the local
// web dev server so `pnpm --filter mobile start` works against
// `pnpm --filter web dev` without any extra setup.
export function apiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
}
