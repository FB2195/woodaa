import type { AppRouter } from "@woodaa/api";
import { createTRPCClient, httpLink } from "@trpc/client";
import { apiBaseUrl } from "./apiConfig";
import { clearTokens, getRefreshToken, setTokens } from "./tokenStore";

// A hook-free tRPC client for the token refresh call inside
// fetchWithAuth (see lib/trpcClient.ts) - that fetch wrapper is a plain
// function created once outside the React tree, so it can't call
// `trpc.auth.refresh.useMutation()`. Mirrors apps/mobile/lib/authClient.ts.
const authClient = createTRPCClient<AppRouter>({
  links: [httpLink({ url: `${apiBaseUrl()}/api/trpc` })],
});

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const result = await authClient.auth.refresh.mutate({ refreshToken });
    await setTokens(result);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}
