import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@woodaa/api";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/session";

// Vercel terminates TLS and forwards the original client address via
// x-forwarded-for (first entry - later ones are intermediate proxies) -
// there's no req.ip equivalent on a Fetch API Request. Used for the
// per-IP rate limiting in packages/api/src/rateLimit.ts.
function clientIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}

const handler = async (req: Request) => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ token, ip: clientIp(req) }),
  });
};

export { handler as GET, handler as POST };
