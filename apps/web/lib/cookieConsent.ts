const CONSENT_COOKIE = "woodaa_cookie_consent";
const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export function readConsentCookie(): "accepted" | "declined" | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  const value = match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
  return value === "accepted" || value === "declined" ? value : null;
}

export function writeConsentCookie(value: "accepted" | "declined") {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearConsentCookie() {
  document.cookie = `${CONSENT_COOKIE}=; path=/; max-age=0`;
}
