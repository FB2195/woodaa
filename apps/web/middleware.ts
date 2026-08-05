import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/session";

// Site-wide gate while woodaa isn't ready for public visitors yet, checked
// before anything else runs. SITE_PASSWORD unset means the gate is off, so
// local dev and CI builds are unaffected - only set in Vercel when the site
// should actually be locked.
function isAuthorized(request: NextRequest): boolean {
  const password = process.env.SITE_PASSWORD;
  if (!password) return true;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  const decoded = atob(header.slice("Basic ".length));
  const suppliedPassword = decoded.split(":")[1] ?? "";
  return suppliedPassword === password;
}

/**
 * The betreiber/admin-dashboard redirect below is UX-level only — the real
 * access check happens server-side via operatorProcedure's JWT
 * verification. It just avoids flashing a dashboard shell at logged-out
 * visitors.
 */
export function middleware(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="woodaa"' },
    });
  }

  const { pathname } = request.nextUrl;
  const isDashboardRoute =
    pathname.startsWith("/betreiber/dashboard") ||
    pathname.startsWith("/admin/dashboard") ||
    pathname.startsWith("/konto") ||
    pathname.startsWith("/favoriten") ||
    // Verbindliches Buchen braucht ein Konto (Sozialdaten, Nachvollziehbarkeit) -
    // unverbindliches Anfragen auf der Einrichtungsseite selbst bleibt offen.
    /^\/einrichtung\/[^/]+\/buchen$/.test(pathname) ||
    // Bewerten braucht ein Konto, weil die Berechtigung (echte, bestätigte
    // Buchung bei dieser Einrichtung) am eingeloggten User hängt.
    /^\/einrichtung\/[^/]+\/bewerten$/.test(pathname);

  if (isDashboardRoute && !request.cookies.has(ACCESS_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
