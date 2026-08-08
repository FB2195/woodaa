import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@woodaa/api";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/session";

const handler = async (req: Request) => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
  // Vercel (and most reverse proxies) set x-forwarded-for; only the first
  // entry is the actual client, later ones are intermediate proxies.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ token, ip }),
  });
};

export { handler as GET, handler as POST };
