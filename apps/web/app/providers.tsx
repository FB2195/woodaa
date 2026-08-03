"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { SessionRefresher } from "@/components/SessionRefresher";
import { trpc } from "@/lib/trpc";

// The access-token cookie now expires after 20 minutes. Rather than every
// tRPC call failing outright once it lapses, retry once through the
// server-side silent-refresh route before giving up - covers the gap the
// proactive SessionRefresher interval doesn't (background/inactive tabs,
// or simply landing right on the boundary).
async function fetchWithSilentRefresh(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.status !== 401) {
    return response;
  }

  const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
  if (!refreshed.ok) {
    return response;
  }

  return fetch(input, init);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: "/api/trpc", fetch: fetchWithSilentRefresh })],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionRefresher />
        {children}
        <CookieConsentBanner />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
