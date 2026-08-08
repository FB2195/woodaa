import { formatDate } from "../../lib/format";
import type { WaitlistEntryData } from "./types";

export function WaitlistPanel({ entries }: { entries: WaitlistEntryData[] }) {
  const waiting = entries.filter((entry) => !entry.notifiedAt);

  if (waiting.length === 0) return null;

  return (
    <div className="rounded-xl2 border border-hairline bg-canvas-panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">Warteliste</h3>
        <span className="rounded-full bg-ink-900/5 px-2 py-0.5 text-xs font-medium text-ink-500">
          {waiting.length}
        </span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {waiting.map((entry) => (
          <li key={entry.id} className="text-xs text-ink-500">
            <p className="font-medium text-ink-700">{entry.name}</p>
            <p>seit {formatDate(entry.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
