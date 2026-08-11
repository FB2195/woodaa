import type { ReactNode } from "react";
import Link from "next/link";
import { ShareFacilityButton } from "@/components/ShareFacilityButton";

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-brand-text-muted transition group-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

function PolicyRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-b border-brand-border py-4 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-brand-text">
        {title}
        <ChevronDownIcon />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-brand-text-muted">{label}</span>
      <span className="text-right text-brand-text">{value}</span>
    </div>
  );
}

export function FacilityPolicyLinks({
  name,
  checkInTime,
  checkOutTime,
  visitingHours,
  wifiInfo,
  parkingInfo,
  petsPolicy,
  cancellationPolicyDays,
}: {
  name: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  visitingHours: string | null;
  wifiInfo: string | null;
  parkingInfo: string | null;
  petsPolicy: string | null;
  cancellationPolicyDays: number | null;
}) {
  const hasHouseRules = checkInTime || checkOutTime || visitingHours || cancellationPolicyDays !== null;
  const hasDetails = wifiInfo || parkingInfo || petsPolicy;

  return (
    <div className="mt-10 rounded-brand-lg border border-brand-border">
      <div className="px-1">
        {hasHouseRules && (
          <PolicyRow title="Unterkunftsrichtlinien">
            <div className="flex flex-col gap-2 px-1 pb-2">
              {checkInTime && <InfoRow label="Check-in" value={checkInTime} />}
              {checkOutTime && <InfoRow label="Check-out" value={checkOutTime} />}
              {visitingHours && <InfoRow label="Besuchszeiten" value={visitingHours} />}
              {cancellationPolicyDays !== null && (
                <InfoRow
                  label="Stornierung"
                  value={`Bis ${cancellationPolicyDays} ${cancellationPolicyDays === 1 ? "Tag" : "Tage"} vorher kostenlos`}
                />
              )}
            </div>
          </PolicyRow>
        )}

        {hasDetails && (
          <PolicyRow title="Wichtige Einzelheiten">
            <div className="flex flex-col gap-2 px-1 pb-2">
              {wifiInfo && <InfoRow label="Internetzugang" value={wifiInfo} />}
              {parkingInfo && <InfoRow label="Parkmöglichkeiten" value={parkingInfo} />}
              {petsPolicy && <InfoRow label="Haustiere" value={petsPolicy} />}
            </div>
          </PolicyRow>
        )}

        <PolicyRow title="Rechtliche Informationen">
          <div className="flex flex-col gap-2 px-1 pb-2 text-sm">
            <Link href="/impressum" className="text-brand-accent underline">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-brand-accent underline">
              Datenschutz
            </Link>
            <Link href="/nutzungsbedingungen" className="text-brand-accent underline">
              Nutzungsbedingungen
            </Link>
          </div>
        </PolicyRow>
      </div>

      <div className="border-t border-brand-border p-4">
        <ShareFacilityButton name={name} />
      </div>
    </div>
  );
}
