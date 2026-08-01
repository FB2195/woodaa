import type { inferRouterOutputs } from "@trpc/server";
import { appRouter, createContext } from "@woodaa/api";
import type { AppRouter } from "@woodaa/api";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "./session";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * Direct server-side tRPC caller for use in Server Components — no HTTP
 * round-trip. Reads the session cookie per-request, so it must be called
 * fresh inside each Server Component render rather than cached at module
 * scope. The `/api/trpc` route handler (same router) is used only by the
 * client-side tRPC React Query client (interactive mutations).
 */
export async function getTrpcServer() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
  return appRouter.createCaller(createContext({ token }));
}
