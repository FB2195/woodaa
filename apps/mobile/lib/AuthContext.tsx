import type { RegisterInput, Role } from "@woodaa/validators";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearTokens, getRefreshToken, loadTokensFromStorage, setTokens } from "./tokenStore";
import { trpc } from "./trpc";

// The minimal shape returned by login/register/verifyTwoFactor - screens
// that need more (emailVerifiedAt, twoFactorEnabled, ...) should query
// trpc.auth.me directly rather than growing this context, same as
// apps/web keeps its session cookie payload minimal and re-fetches detail.
export type AuthUser = { id: string; name: string; email: string; role: Role };

type LoginOutcome =
  | { twoFactorRequired: true; challengeToken: string }
  | { twoFactorRequired: false; user: AuthUser };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  verifyTwoFactor: (challengeToken: string, code: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation();
  const verifyTwoFactorMutation = trpc.auth.verifyTwoFactor.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
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
        const me = await utils.auth.me.fetch();
        if (!cancelled) setUser(me);
      } catch {
        // Access token invalid/expired and the silent-refresh-on-401 path
        // (see lib/trpcClient.ts) already tried once inside that fetch -
        // both tokens are stale, so drop back to logged-out.
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
      register: async (input) => {
        const result = await registerMutation.mutateAsync(input);
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
          // Best-effort - the tokens are already gone client-side either way.
          logoutMutation.mutate({ refreshToken });
        }
      },
    }),
    // Mutation objects from useMutation() are stable-enough for this
    // purpose (same instance across re-renders unless the component
    // unmounts) - only user/isLoading need to trigger a new context value.
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
