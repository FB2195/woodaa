"use client";

import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";

// Staff-visibility list only for v1 - no "mark contacted" action yet, see
// the comment on operator.waitlistEntries. notifiedAt (set by
// notifyWaitlist once a spot opened and an email went out) is shown so the
// operator can tell who's already been nudged.
export function WaitlistEntries() {
  const entries = trpc.operator.waitlistEntries.useQuery();

  if (!entries.data || entries.data.length === 0) return null;

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <h2 className="text-lg font-semibold text-brand-heading">
        Warteliste ({entries.data.length})
      </h2>
      <p className="mt-1 text-sm text-brand-text-muted">
        Interessenten, die auf einen freien Platz warten - wird automatisch benachrichtigt, sobald
        bei der jeweiligen Pflegeart wieder Kapazität frei wird.
      </p>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {entries.data.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-col gap-1 rounded-brand-md border border-brand-border p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-brand-text">{entry.name}</span>
              <span className="text-xs text-brand-text-muted">
                {bookingTypeLabels[entry.bookingType]} · seit {formatDate(entry.createdAt)}
              </span>
            </div>
            <p className="text-brand-text-muted">
              {entry.email}
              {entry.phone && ` · ${entry.phone}`}
              {entry.pflegegrad !== null && ` · Pflegegrad ${entry.pflegegrad}`}
            </p>
            {entry.message && <p className="text-brand-text-muted">„{entry.message}"</p>}
            <p className="text-xs text-brand-text-muted">
              {entry.notifiedAt
                ? `Benachrichtigt am ${formatDate(entry.notifiedAt)}`
                : "Noch nicht benachrichtigt"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
