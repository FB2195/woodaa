import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@woodaa/api";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/session";

const handler = async (req: Request) => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ token }),
  });
};

export { handler as GET, handler as POST };
