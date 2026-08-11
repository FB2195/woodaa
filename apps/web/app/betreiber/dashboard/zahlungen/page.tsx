import type { Metadata } from "next";
import { PaymentApprovals } from "@/components/dashboard/PaymentApprovals";
import { getMyFacility } from "@/lib/operatorData";

export const metadata: Metadata = { title: "Zahlungen" };

export default async function OperatorZahlungenPage() {
  const facility = await getMyFacility();
  if (!facility) return null;

  const bookings = facility.units.flatMap((u) => u.bookings);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold text-brand-heading">Zahlungen</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Zahlungen per Rechnung oder Kostenübernahme durch die Pflegekasse freigeben oder ablehnen.
        </p>
      </div>
      <PaymentApprovals bookings={bookings} />
    </>
  );
}
