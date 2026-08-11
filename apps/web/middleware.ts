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

// business.woodaa.de is the Betreiber-only surface (separate from the
// consumer-facing woodaa.de/www.woodaa.de) - see the redirects below.
const BUSINESS_HOST = "business.woodaa.de";
const CONSUMER_HOSTS = new Set(["woodaa.de", "www.woodaa.de"]);

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
  const hostname = request.nextUrl.hostname;

  // A bare visit to business.woodaa.de lands on the Betreiber login rather
  // than the consumer homepage - the domain exists specifically so
  // facility operators land somewhere that doesn't read as "the same site
  // families search on", see the comment on /betreiber/login.
  if (hostname === BUSINESS_HOST && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/betreiber/login";
    return NextResponse.redirect(url);
  }

  // The reverse: reaching the Betreiber area from the consumer domain
  // sends people across to the dedicated business domain instead of
  // serving it there too, so there's exactly one place operators use.
  if (CONSUMER_HOSTS.has(hostname) && pathname.startsWith("/betreiber")) {
    const url = new URL(`https://${BUSINESS_HOST}${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

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
    // Keeps operators on their own branded login rather than the generic
    // one, same reasoning as the business.woodaa.de root redirect above.
    url.pathname = pathname.startsWith("/betreiber") ? "/betreiber/login" : "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // /api is exempt from the site-wide gate: /api/trpc now accepts Bearer
  // tokens for the mobile app (see route.ts), which has no Basic-Auth
  // credential to send, and /api/webhooks/stripe must stay reachable by
  // Stripe regardless - Stripe never sends the site password either.
  // Data access itself stays protected by protectedProcedure's JWT check,
  // same as it always was for a logged-in browser session.
  //
  // /facility-photos is exempt for the same "mobile has no Basic-Auth
  // credential" reason as /api: withPhotoUrl (packages/api/src/r2.ts)
  // returns these as root-relative URLs that the mobile app resolves
  // against this origin (see apps/mobile/lib/photoUrl.ts) with a plain,
  // unauthenticated fetch - a browser session gets away with it because
  // it already cached Basic-Auth credentials from loading the page itself,
  // but the app has none to send. Not a data exposure: these are seed/demo
  // building photos, not Sozialdaten, and real operator-uploaded photos
  // already bypass this gate entirely by living on R2's separate domain.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|facility-photos).*)"],
};
