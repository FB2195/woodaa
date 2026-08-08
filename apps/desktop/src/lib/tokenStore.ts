export type StoredTokens = { accessToken: string; refreshToken: string };

// Kept in module scope (not React state) so the tRPC httpBatchLink's fetch
// wrapper - a plain function created once outside the React tree - can
// always read the current token. Mirrors apps/mobile/lib/tokenStore.ts;
// the persistence backend here is the main process's encrypted-file
// storage (window.electronAuth, via electron/preload.ts) instead of
// expo-secure-store.
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export async function loadTokensFromStorage(): Promise<StoredTokens | null> {
  const stored = await window.electronAuth.getTokens();
  if (!stored) {
    accessToken = null;
    refreshToken = null;
    return null;
  }
  accessToken = stored.accessToken;
  refreshToken = stored.refreshToken;
  return stored;
}

export async function setTokens(tokens: StoredTokens): Promise<void> {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  await window.electronAuth.setTokens(tokens);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await window.electronAuth.clearTokens();
}
