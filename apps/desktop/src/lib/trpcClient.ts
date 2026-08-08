import { httpBatchLink } from "@trpc/client";
import { apiBaseUrl } from "./apiConfig";
import { refreshAccessToken } from "./authClient";
import { getAccessToken } from "./tokenStore";

function withAuthHeader(init: RequestInit | undefined, token: string | null): RequestInit {
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

// Mirrors apps/mobile/lib/trpcClient.ts / apps/web's fetchWithSilentRefresh:
// attach the current access token, and on a 401 refresh once and retry
// before giving up.
async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, withAuthHeader(init, getAccessToken()));
  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return response;
  }

  return fetch(input, withAuthHeader(init, getAccessToken()));
}

export function createDesktopTrpcLinks() {
  return [httpBatchLink({ url: `${apiBaseUrl()}/api/trpc`, fetch: fetchWithAuth })];
}
