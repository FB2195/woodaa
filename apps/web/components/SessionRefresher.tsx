"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

// Proactively keeps the session cookie fresh well inside the access token's
// 20-minute TTL, so Server Component navigations (which have no retry
// mechanism of their own, unlike the tRPC fetch wrapper in providers.tsx)
// almost always see a valid token. A no-op 401 for logged-out visitors is
// cheap and harmless.
export function SessionRefresher() {
  useEffect(() => {
    const id = setInterval(() => {
      fetch("/api/auth/refresh", { method: "POST" }).catch(() => {});
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
