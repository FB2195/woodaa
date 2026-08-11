const CONSENT_COOKIE = "woodaa_cookie_consent";
const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

// Cookies don't fire a native change event, so components other than
// CookieConsentBanner that need to react the moment consent is decided
// (e.g. MobileBookingBar, which has to stop ceding its spot to the
// banner) listen for this instead of polling.
export const CONSENT_CHANGED_EVENT = "woodaa:cookie-consent-changed";

export function readConsentCookie(): "accepted" | "declined" | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  const value = match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
  return value === "accepted" || value === "declined" ? value : null;
}

export function writeConsentCookie(value: "accepted" | "declined") {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax`;
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}

export function clearConsentCookie() {
  document.cookie = `${CONSENT_COOKIE}=; path=/; max-age=0`;
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}
