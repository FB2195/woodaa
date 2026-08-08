import type { Role } from "@woodaa/validators";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearTokens, getRefreshToken, loadTokensFromStorage, setTokens } from "./tokenStore";
import { trpc } from "./trpc";

// The minimal shape returned by login/verifyTwoFactor - screens that need
// more (emailVerifiedAt, twoFactorEnabled, ...) should query trpc.auth.me
// directly rather than growing this context. Mirrors apps/mobile's
// AuthContext.
export type AuthUser = { id: string; name: string; email: string; role: Role };

type LoginOutcome =
  | { twoFactorRequired: true; challengeToken: string }
  | { twoFactorRequired: false; user: AuthUser };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  verifyTwoFactor: (challengeToken: string, code: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation();
  const verifyTwoFactorMutation = trpc.auth.verifyTwoFactor.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadTokensFromStorage();
      if (!stored) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      try {
        const me = await utils.client.auth.me.query();
        if (!cancelled) setUser(me);
      } catch {
        await clearTokens();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Runs once on mount only - rehydration, not a reactive auth check.
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (email, password) => {
        const result = await loginMutation.mutateAsync({ email, password });
        if (result.twoFactorRequired) {
          return { twoFactorRequired: true, challengeToken: result.challengeToken };
        }
        await setTokens(result);
        setUser(result.user);
        await utils.invalidate();
        return { twoFactorRequired: false, user: result.user };
      },
      verifyTwoFactor: async (challengeToken, code) => {
        const result = await verifyTwoFactorMutation.mutateAsync({ challengeToken, code });
        await setTokens(result);
        setUser(result.user);
        await utils.invalidate();
        return result.user;
      },
      logout: async () => {
        const refreshToken = getRefreshToken();
        await clearTokens();
        setUser(null);
        await utils.invalidate();
        if (refreshToken) {
          logoutMutation.mutate({ refreshToken });
        }
      },
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
