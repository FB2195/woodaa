import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/session";

/**
 * UX-level redirect only — the real access check happens server-side via
 * operatorProcedure's JWT verification. This just avoids flashing a
 * dashboard shell at logged-out visitors.
 */
export function middleware(request: NextRequest) {
  if (!request.cookies.has(ACCESS_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/betreiber/dashboard/:path*", "/admin/dashboard/:path*"],
};
