"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

// One row of the "Live" list on the admin dashboard - unlike the review
// queue rows above it, this facility is already public, so the only action
// here is toggling the "Verifiziert"-Badge (see admin.setFacilityVerified /
// VerifiedBadge.tsx), not approve/reject.
export function ActiveFacilityRow({
  facility,
}: {
  facility: {
    id: string;
    name: string;
    city: string;
    operatorName: string;
    operatorPhone: string | null;
    operatorPhoneDurchwahl: string | null;
    operatorEmail: string;
    verifiedAt: Date | string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const setVerified = trpc.admin.setFacilityVerified.useMutation();
  const verified = facility.verifiedAt !== null;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-1">
      <span>
        {facility.name} — {facility.city} · {facility.operatorName}
        {facility.operatorPhone ? ` · ${facility.operatorPhone}` : ""}
        {facility.operatorPhoneDurchwahl ? ` (${facility.operatorPhoneDurchwahl})` : ""} ·{" "}
        {facility.operatorEmail}
      </span>
      <span className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          type="button"
          disabled={setVerified.isPending}
          onClick={async () => {
            setError(null);
            try {
              await setVerified.mutateAsync({ id: facility.id, verified: !verified });
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
            }
          }}
          className={`rounded-brand-full px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
            verified
              ? "bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20"
              : "border border-brand-border text-brand-text-muted hover:text-brand-text"
          }`}
        >
          {verified ? "✓ Verifiziert" : "Als verifiziert markieren"}
        </button>
      </span>
    </li>
  );
}
