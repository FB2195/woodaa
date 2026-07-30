import { initTRPC } from "@trpc/server";
import { db } from "@woodaa/db";

/**
 * tRPC context — extended in later phases with the authenticated user
 * (parsed from the JWT access token) once auth lands.
 */
export function createContext() {
  return { db };
}
export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
