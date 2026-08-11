"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { appStoreUrlFor, detectAppPlatform } from "@/lib/appStoreLinks";

const DISMISSED_KEY = "woodaa_app_banner_dismissed";

// Only worth showing on an actual phone browser (mirrors Booking.com's
// banner, which is mobile-web-only) - on desktop there's no store to send
// people to. Detected + gated entirely client-side so it never affects
// server-rendered markup/hydration.
export function AppPromoBanner() {
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setPlatform(detectAppPlatform(navigator.userAgent));
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "1");
  }, []);

  if (!platform || dismissed) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="flex items-center gap-3 bg-brand-accent px-4 py-2.5 text-white">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Schließen"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>

      <Image
        src="/logo.png"
        alt=""
        width={478}
        height={142}
        className="h-7 w-auto shrink-0 rounded-brand-sm bg-white p-1"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">woodaa App</p>
        <p className="truncate text-xs text-white/85">Pflegeplätze finden – jetzt herunterladen</p>
      </div>

      <a
        href={appStoreUrlFor(platform)}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-brand-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-accent hover:opacity-90"
      >
        Öffnen
      </a>
    </div>
  );
}
