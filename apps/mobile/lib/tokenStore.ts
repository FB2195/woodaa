import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "woodaa.accessToken";
const REFRESH_TOKEN_KEY = "woodaa.refreshToken";

export type StoredTokens = { accessToken: string; refreshToken: string };

// Kept in module scope (not React state) so the tRPC httpBatchLink's fetch
// wrapper - a plain function created once outside any component - can
// always read the current token without re-creating the tRPC client on
// every login/refresh/logout.
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export async function loadTokensFromStorage(): Promise<StoredTokens | null> {
  const [storedAccess, storedRefresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  if (!storedAccess || !storedRefresh) {
    accessToken = null;
    refreshToken = null;
    return null;
  }
  accessToken = storedAccess;
  refreshToken = storedRefresh;
  return { accessToken: storedAccess, refreshToken: storedRefresh };
}

export async function setTokens(tokens: StoredTokens): Promise<void> {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
