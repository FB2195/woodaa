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

  store.set(ACCESS_COOKIE, accessToken, { ...base, maxAge: 60 * 60 * 24 * 7 });
  if (refreshToken) {
    store.set(REFRESH_COOKIE, refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  return NextResponse.json({ success: true });
}
