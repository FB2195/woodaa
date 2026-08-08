import type { PrismaClient } from "@prisma/client";

// Only decisions from the last LOOKBACK_DAYS count towards the badge - a
// facility that used to be slow (or fast) a while ago but has since changed
// its process shouldn't be stuck with a stale figure forever.
const LOOKBACK_DAYS = 90;

// Below this many decided bookings a median is too noisy to promise
// families anything useful - fail open (no badge) rather than show a
// misleading number from a tiny sample, same "both null = don't filter"
// fail-open spirit as Facility.minPflegegrad/maxPflegegrad in schema.prisma.
const MIN_SAMPLE_SIZE = 3;

// Coarse, roughly-doubling tiers - an exact "17.3 Std." figure would read
// as spurious precision families can't act on. First bucket whose maxHours
// the median falls under wins; anything slower than the last tier falls
// through to a vaguer catch-all rather than naming an unflattering number.
const BUCKETS: { maxHours: number; label: string }[] = [
  { maxHours: 1, label: "innerhalb einer Stunde" },
  { maxHours: 6, label: "innerhalb von 6 Std." },
  { maxHours: 24, label: "innerhalb von 24 Std." },
  { maxHours: 48, label: "innerhalb von 48 Std." },
];
const FALLBACK_LABEL = "in der Regel innerhalb weniger Tage";

function bucketLabel(medianHours: number): string {
  return BUCKETS.find((b) => medianHours <= b.maxHours)?.label ?? FALLBACK_LABEL;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

// Median rather than mean - one outlier (a decision made after a few days'
// absence) shouldn't drag a facility that usually replies within hours into
// a worse-looking bucket.
export function responseTimeBadgeFromDecisions(
  decisions: { createdAt: Date; facilityDecisionAt: Date }[],
): string | null {
  if (decisions.length < MIN_SAMPLE_SIZE) return null;
  const hours = decisions.map(
    (d) => (d.facilityDecisionAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60),
  );
  return `Antwortet meist ${bucketLabel(median(hours))}`;
}

// Batched (one query for every facility on the results page, not one per
// facility) - same no-N+1 spirit as facility.ts's ratingRows. Callers are
// expected to only pass ids of MANUELL-mode facilities (see the comment on
// bookingApprovalMode in schema.prisma) - AUTOMATISCH facilities have no
// meaningful facilityDecisionAt spread since confirmBooking/rejectBooking
// only ever run for MANUELL bookings.
export async function responseTimeBadgesByFacility(
  db: PrismaClient,
  facilityIds: string[],
): Promise<Map<string, string>> {
  if (facilityIds.length === 0) return new Map();

  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const decided = await db.booking.findMany({
    where: {
      facilityId: { in: facilityIds },
      facilityDecisionAt: { not: null },
      createdAt: { gte: cutoff },
    },
    select: { facilityId: true, createdAt: true, facilityDecisionAt: true },
  });

  const byFacility = new Map<string, { createdAt: Date; facilityDecisionAt: Date }[]>();
  for (const row of decided) {
    if (!row.facilityDecisionAt) continue;
    const list = byFacility.get(row.facilityId) ?? [];
    list.push({ createdAt: row.createdAt, facilityDecisionAt: row.facilityDecisionAt });
    byFacility.set(row.facilityId, list);
  }

  const badges = new Map<string, string>();
  for (const [facilityId, decisions] of byFacility) {
    const badge = responseTimeBadgeFromDecisions(decisions);
    if (badge) badges.set(facilityId, badge);
  }
  return badges;
}
