import type { Metadata } from "next";
import Link from "next/link";
import type { BookingType } from "@woodaa/validators";
import { PublicListingPrompt } from "@/components/dashboard/PublicListingPrompt";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { getMyFacility } from "@/lib/operatorData";
import { getTrpcServer } from "@/lib/trpc-server";

export const metadata: Metadata = { title: "Übersicht" };

const allBookingTypes: BookingType[] = [
  "STATIONAERE_AUFNAHME",
  "KURZZEITPFLEGE",
  "TAGESPFLEGE",
  "NACHTPFLEGE",
];

function statusLabel(status: string, hasDescription: boolean): string {
  if (status === "ACTIVE") return "Live";
  if (status === "REJECTED") return "Abgelehnt";
  return hasDescription ? "Wird geprüft" : "Nur intern";
}

function StatTile({
  label,
  value,
  hint,
  href,
  urgent,
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-1 rounded-brand-lg border p-5 transition hover:shadow-md ${
        urgent ? "border-brand-accent bg-brand-accent/5" : "border-brand-border bg-brand-surface"
      }`}
    >
      <span className="text-sm font-medium text-brand-text-muted">{label}</span>
      <span className="text-3xl font-bold text-brand-heading">{value}</span>
      {hint && <span className="text-xs text-brand-text-muted">{hint}</span>}
    </Link>
  );
}

export default async function OperatorOverviewPage() {
  const [facility, waitlist] = await Promise.all([
    getMyFacility(),
    (await getTrpcServer()).operator.waitlistEntries(),
  ]);

  // Layout already redirects to CreateFacilityForm when this is null - the
  // check here is just so TypeScript knows `facility` is non-null below.
  if (!facility) return null;

  const openBookingApprovals = facility.units
    .flatMap((u) => u.bookings)
    .filter((b) => b.facilityApprovalStatus === "AUSSTEHEND").length;
  const openPaymentApprovals = facility.units
    .flatMap((u) => u.bookings)
    .filter((b) => b.paymentStatus === "WARTET_AUF_HEIM_FREIGABE").length;
  const awaitingReview = facility.status === "PENDING_REVIEW" && facility.description !== "";

  return (
    <>
      <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-heading">{facility.name}</h1>
          <span
            className={`rounded-brand-full px-3 py-1 text-xs font-medium ${
              facility.status === "ACTIVE"
                ? "bg-brand-accent/10 text-brand-accent"
                : "bg-brand-border text-brand-text-muted"
            }`}
          >
            {statusLabel(facility.status, facility.description !== "")}
          </span>
        </div>
        <p className="mt-1 text-sm text-brand-text-muted">
          {facility.street}, {facility.postalCode} {facility.city}
        </p>
        {awaitingReview && (
          <p className="mt-3 text-sm text-brand-text-muted">
            Deine Einrichtung wird gerade von unserem Team geprüft und ist noch nicht öffentlich
            sichtbar.
          </p>
        )}
        {facility.status === "REJECTED" && (
          <p className="mt-3 text-sm text-red-600">
            Deine Einrichtung wurde nicht freigeschaltet. Melde dich gerne bei uns, falls das ein
            Irrtum war.
          </p>
        )}
      </div>

      {facility.status === "PENDING_REVIEW" && !facility.description && <PublicListingPrompt />}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text-muted">
          Auf einen Blick
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile
            label="Offene Buchungsanfragen"
            value={String(openBookingApprovals)}
            href="/betreiber/dashboard/buchungen"
            urgent={openBookingApprovals > 0}
          />
          <StatTile
            label="Offene Zahlungsfreigaben"
            value={String(openPaymentApprovals)}
            href="/betreiber/dashboard/zahlungen"
            urgent={openPaymentApprovals > 0}
          />
          <StatTile
            label="Warteliste"
            value={String(waitlist.length)}
            href="/betreiber/dashboard/buchungen"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text-muted">
          Belegung
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {allBookingTypes.map((type) => {
            const capacity = facility.capacities.find((c) => c.bookingType === type);
            const units = facility.units.filter((u) => u.bookingType === type);
            const total = capacity?.totalSlots ?? 0;
            const occupied = units.filter((u) => u.bookings.length > 0).length;
            return (
              <Link
                key={type}
                href="/betreiber/dashboard/belegung"
                className="flex flex-col gap-1 rounded-brand-lg border border-brand-border bg-brand-surface p-5 transition hover:shadow-md"
              >
                <span className="text-sm font-medium text-brand-text-muted">
                  {bookingTypeLabels[type]}
                </span>
                <span className="text-2xl font-bold text-brand-heading">
                  {total > 0 ? `${occupied}/${total}` : "–"}
                </span>
                <span className="text-xs text-brand-text-muted">
                  {total === 0 ? "noch nicht eingerichtet" : "belegt"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
