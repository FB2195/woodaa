"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompareList } from "@/lib/compare";

// Booking.com-style floating "compare tray" - mounted once in the root
// layout (see app/layout.tsx) so it follows the selection across /suche,
// /favoriten and the facility detail page, not just one of them.
export function CompareBar() {
  const pathname = usePathname();
  const { ids, clear } = useCompareList();

  // Already on the comparison view itself - the bar would just be a
  // redundant "Vergleichen" button pointing at the page you're on. Also
  // hidden on /betreiber: a Bevollmächtigte/r who both compares facilities
  // as a family member AND runs their own Einrichtung on the same account
  // would otherwise see this consumer-search leftover float over their
  // operator dashboard.
  if (
    ids.length === 0 ||
    pathname?.startsWith("/vergleichen") ||
    pathname?.startsWith("/betreiber")
  )
    return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-brand-full border border-brand-border bg-brand-surface px-4 py-2 shadow-lg">
        <span className="text-sm text-brand-text">
          {ids.length} {ids.length === 1 ? "Einrichtung" : "Einrichtungen"} vergleichen
        </span>
        <Link
          href={`/vergleichen?ids=${ids.map(encodeURIComponent).join(",")}`}
          className="rounded-brand-md bg-brand-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Vergleichen
        </Link>
        <button
          type="button"
          onClick={clear}
          className="text-sm text-brand-text-muted underline hover:text-brand-text"
        >
          Leeren
        </button>
      </div>
    </div>
  );
}
