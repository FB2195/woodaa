import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  appRouter,
  createContext,
} from "@woodaa/api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

const isProduction = process.env.NODE_ENV === "production";

// Server-side proxy for the refresh flow: the refresh token lives in an
// httpOnly cookie, so client JS can never read it or call the tRPC
// `auth.refresh` mutation directly. This route does that on the client's
// behalf and re-sets both cookies with the rotated tokens.
export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "no session" }, { status: 401 });
  }

  try {
    const caller = appRouter.createCaller(createContext({ token: null }));
    const result = await caller.auth.refresh({ refreshToken });

    const base = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };
    store.set(ACCESS_COOKIE, result.accessToken, { ...base, maxAge: ACCESS_TOKEN_TTL_SECONDS });
    store.set(REFRESH_COOKIE, result.refreshToken, { ...base, maxAge: REFRESH_TOKEN_TTL_SECONDS });

    return NextResponse.json({ success: true });
  } catch {
    store.delete(ACCESS_COOKIE);
    store.delete(REFRESH_COOKIE);
    return NextResponse.json({ error: "refresh failed" }, { status: 401 });
  }
}
