"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

// Shared by Header's hamburger menu and AccountMenu's bottom row - same
// mutation, same post-logout cache reset, just different trigger UI.
export function useLogout() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      // router.refresh() alone only re-fetches Server Components, not React
      // Query's cache - and even invalidate() isn't enough on its own:
      // React Query keeps the last successful `data` around when a
      // background refetch errors (401 after logout), so `me.data` stayed
      // populated until a manual reload. reset() clears it to undefined
      // synchronously before refetching.
      await utils.auth.me.reset();
      await utils.invalidate();
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return { logout, loggingOut };
}
