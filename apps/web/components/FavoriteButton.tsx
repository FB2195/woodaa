"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export function FavoriteButton({
  facilityId,
  initialFavorited,
  className,
}: {
  facilityId: string;
  initialFavorited: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);

  // On the search page, `initialFavorited` starts false and only becomes
  // accurate once the (async) favorite.myFacilityIds query resolves after
  // mount - useState's initial value alone would miss that update, so
  // re-sync whenever the prop actually changes.
  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const toggle = trpc.favorite.toggle.useMutation({
    onSuccess: (result) => setFavorited(result.favorited),
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      }
    },
  });

  return (
    <button
      type="button"
      onClick={(event) => {
        // FacilityCard wraps this in a <Link> - don't let the click
        // trigger navigation too.
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate({ facilityId });
      }}
      disabled={toggle.isPending}
      aria-label={favorited ? "Von Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      aria-pressed={favorited}
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-brand-full border border-brand-border bg-brand-surface text-lg transition hover:bg-brand-background disabled:opacity-50"
      }
    >
      <span aria-hidden="true" className={favorited ? "text-red-500" : "text-brand-text-muted"}>
        {favorited ? "♥" : "♡"}
      </span>
    </button>
  );
}
