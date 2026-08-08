export type StoredTokens = { accessToken: string; refreshToken: string };

declare global {
  interface Window {
    electronAuth: {
      getTokens: () => Promise<StoredTokens | null>;
      setTokens: (tokens: StoredTokens) => Promise<void>;
      clearTokens: () => Promise<void>;
    };
  }
}
