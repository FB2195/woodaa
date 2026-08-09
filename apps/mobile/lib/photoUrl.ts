import { apiBaseUrl } from "./apiConfig";

// Facility photo URLs come from packages/api/src/r2.ts#withPhotoUrl. Real
// operator uploads resolve to an absolute R2 URL, but seed/demo photos are
// root-relative paths (e.g. "/seed-photos/foo.jpg") meant to be served by
// Next.js from apps/web/public - the web app resolves those against its own
// origin for free, but React Native's Image has no origin to fall back on
// and silently renders nothing for a path-only uri. Resolve those against
// the same host the tRPC client talks to.
export function resolvePhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return `${apiBaseUrl()}${url}`;
  return url;
}
