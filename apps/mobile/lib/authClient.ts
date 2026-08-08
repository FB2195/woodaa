import type { AppRouter } from "@woodaa/api";
import { createTRPCClient, httpLink } from "@trpc/client";
import { apiUrl } from "./apiConfig";
import { clearTokens, getRefreshToken, setTokens } from "./tokenStore";

// A hook-free tRPC client, used only for the token refresh call inside
// fetchWithAuth below (see lib/trpcClient.ts) - that fetch wrapper is a
// plain function created once outside the React tree, so it can't call
// `trpc.auth.refresh.useMutation()`.
const authClient = createTRPCClient<AppRouter>({
  links: [httpLink({ url: `${apiUrl()}/trpc` })],
});

// Returns true if the access token was refreshed and a retry is worth it.
// Clears tokens on any failure (expired/revoked/reused refresh token) so
// the app falls back to a logged-out state instead of retrying forever.
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
