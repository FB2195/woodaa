// Inlined at build time by Vite (VITE_ prefix). Points at apps/web, not the
// standalone apps/api Fastify server - see apps/mobile/lib/apiConfig.ts for
// why (apps/api was never deployed; apps/web's /api/trpc route handler
// already accepts the same Bearer access token this app sends).
export function apiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000";
}
