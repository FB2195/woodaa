import { PrismaClient } from "@prisma/client";

/**
 * Single shared Prisma client instance, reused across apps/api and any
 * scripts. Avoids exhausting Postgres connections via repeated
 * `new PrismaClient()` calls during development hot-reload.
 */
declare global {
  var __woodaaPrisma: PrismaClient | undefined;
}

export const db = globalThis.__woodaaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__woodaaPrisma = db;
}
