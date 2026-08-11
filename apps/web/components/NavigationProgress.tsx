"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

// Clicking a Link previously gave zero feedback until the next page had
// actually streamed in - felt like the click didn't register. This is a
// generic top progress bar (a la YouTube/GitHub): starts as soon as any
// internal link is clicked, completes once the route actually changes.
function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const growTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function start() {
      if (growTimer.current) return;
      setVisible(true);
      setWidth(15);
      growTimer.current = setInterval(() => {
        setWidth((w) => (w < 85 ? w + (85 - w) * 0.1 : w));
      }, 200);
      // Safety net for clicks that don't end up changing the route (e.g.
      // an in-page anchor, or a navigation that gets cancelled) - the bar
      // shouldn't stay stuck forever.
      safetyTimeout.current = setTimeout(finish, 4000);
    }

    function finish() {
      if (growTimer.current) {
        clearInterval(growTimer.current);
        growTimer.current = null;
      }
      if (safetyTimeout.current) {
        clearTimeout(safetyTimeout.current);
        safetyTimeout.current = null;
      }
      setWidth(100);
      setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 200);
    }

    function onClick(event: MouseEvent) {
      // Note: next/link's own handler runs first (React's delegated
      // listener is attached before this effect ever runs) and calls
      // preventDefault() synchronously as part of starting its client-side
      // transition - so `defaultPrevented` is expected to already be true
      // for exactly the clicks we care about here. Don't bail on it.
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (
        !anchor ||
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      ) {
        return;
      }
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const samePage =
        url.pathname === window.location.pathname && url.search === window.location.search;
      if (samePage) return;
      start();
    }

    // Route actually changed - whatever navigation was pending is done.
    finish();

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      if (growTimer.current) clearInterval(growTimer.current);
      if (safetyTimeout.current) clearTimeout(safetyTimeout.current);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className="h-full bg-brand-accent transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
