"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BookingType, Pflegegrad } from "@woodaa/validators";
import { trpc } from "@/lib/trpc";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

// Only meaningful with a city filter set - SavedSearch requires one (see
// the comment on the model in schema.prisma), so this stays hidden rather
// than offering to save a search that would match too broadly to alert on.
export function SaveSearchButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [saved, setSaved] = useState(false);

  const city = searchParams.get("city")?.trim();
  const bookingType = BookingType.safeParse(searchParams.get("type") ?? undefined);
  const pflegegrad = Pflegegrad.safeParse(
    searchParams.get("pflegegrad") ? Number(searchParams.get("pflegegrad")) : undefined,
  );

  const create = trpc.savedSearch.create.useMutation({
    onSuccess: () => setSaved(true),
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        router.push(`/login?next=${encodeURIComponent(`${pathname}?${searchParams.toString()}`)}`);
      }
    },
  });

  if (!city) return null;

  if (saved) {
    return (
      <span className="flex items-center gap-1.5 rounded-brand-md border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent">
        <BellIcon />
        Gespeichert
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        create.mutate({
          city,
          bookingType: bookingType.success ? bookingType.data : undefined,
          pflegegrad: pflegegrad.success ? pflegegrad.data : undefined,
        })
      }
      disabled={create.isPending}
      className="flex items-center gap-1.5 rounded-brand-md border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-surface disabled:opacity-50"
    >
      <BellIcon />
      Suche speichern
    </button>
  );
}
