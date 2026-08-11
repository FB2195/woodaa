"use client";

import { useState } from "react";

export function ShareFacilityButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        // User cancelled the native share sheet - not an error worth surfacing.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex w-full items-center justify-between rounded-brand-md border border-brand-border px-4 py-3 text-left text-sm font-semibold text-brand-text transition hover:bg-brand-background"
    >
      Link der Einrichtung teilen
      <span className="text-xs font-normal text-brand-text-muted">
        {copied ? "Link kopiert!" : ""}
      </span>
    </button>
  );
}
