// Trust signal shown on facility cards and the facility detail page once an
// admin has verified the facility (see admin.setFacilityVerified). Purely
// informational - independent of Facility.status, which already gates
// public visibility; this doesn't gate anything further.
export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-brand-full bg-brand-accent/10 px-2.5 py-1 text-xs font-medium text-brand-accent ${className}`}
      title="Von woodaa geprüft und verifiziert"
    >
      <span aria-hidden="true">✓</span>
      Verifiziert
    </span>
  );
}
