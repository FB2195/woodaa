import { appRouter, createContext } from "@woodaa/api";

/**
 * Direct server-side tRPC caller for use in Server Components — no HTTP
 * round-trip. The `/api/trpc` route handler (same router) is used only by
 * the client-side tRPC React Query client (interactive mutations).
 */
export const trpcServer = appRouter.createCaller(createContext());
