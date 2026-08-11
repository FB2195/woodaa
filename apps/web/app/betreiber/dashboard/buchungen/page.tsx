import { BookingApprovalModeForm } from "@/components/dashboard/BookingApprovalModeForm";
import { BookingApprovals } from "@/components/dashboard/BookingApprovals";
import { WaitlistEntries } from "@/components/dashboard/WaitlistEntries";
import { getMyFacility } from "@/lib/operatorData";

export default async function OperatorBuchungenPage() {
  const facility = await getMyFacility();
  if (!facility) return null;

  const bookings = facility.units.flatMap((u) => u.bookings);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold text-brand-heading">Buchungen</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Anfragen bestätigen oder ablehnen, Warteliste im Blick behalten und festlegen, wie neue
          Buchungen freigegeben werden.
        </p>
      </div>
      <BookingApprovals bookings={bookings} />
      <WaitlistEntries />
      <BookingApprovalModeForm mode={facility.bookingApprovalMode} />
    </>
  );
}
