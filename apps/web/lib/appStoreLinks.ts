// Android's Play Store URL only needs the fixed package name - it's
// correct and stable from day one, works the moment the app is actually
// published (until then it just 404s, which is fine to link to already).
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=de.woodaa.app";

// Apple's App Store deep link needs the numeric app ID assigned once the
// app record is created in App Store Connect - we don't have that yet, so
// this points at a search results page as an interim stand-in. Swap this
// for `https://apps.apple.com/de/app/id<NUMERIC_ID>` the moment that ID
// exists (same spot in mobile-ios-testflight-build.yml's release notes
// would be worth updating too).
export const APP_STORE_URL = "https://apps.apple.com/de/search?term=woodaa";

export type AppPlatform = "ios" | "android" | null;

export function detectAppPlatform(userAgent: string): AppPlatform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return null;
}

export function appStoreUrlFor(platform: AppPlatform): string {
  return platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
}
