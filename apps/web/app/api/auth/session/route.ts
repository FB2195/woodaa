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

export async function POST(req: Request) {
  const { accessToken, refreshToken } = (await req.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken fehlt" }, { status: 400 });
  }

  const store = await cookies();
  const base = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
  };

  store.set(ACCESS_COOKIE, accessToken, { ...base, maxAge: ACCESS_TOKEN_TTL_SECONDS });
  if (refreshToken) {
    store.set(REFRESH_COOKIE, refreshToken, { ...base, maxAge: REFRESH_TOKEN_TTL_SECONDS });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    // Best-effort: cookies get cleared below regardless of whether the
    // server-side revoke succeeds - logout must never appear to "fail".
    await appRouter
      .createCaller(createContext({ token: null }))
      .auth.logout({ refreshToken })
      .catch(() => {});
  }

  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  return NextResponse.json({ success: true });
}
