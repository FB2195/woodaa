import { AmenitiesEditor } from "@/components/dashboard/AmenitiesEditor";
import { FacilityContactForm } from "@/components/dashboard/FacilityContactForm";
import { HouseRulesForm } from "@/components/dashboard/HouseRulesForm";
import { PflegegradSuitabilityForm } from "@/components/dashboard/PflegegradSuitabilityForm";
import { PhotoManager } from "@/components/dashboard/PhotoManager";
import { getMyFacility } from "@/lib/operatorData";

export default async function OperatorEinstellungenPage() {
  const facility = await getMyFacility();
  if (!facility) return null;

  return (
    <>
      <div>
        <h1 className="text-xl font-bold text-brand-heading">Einstellungen</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Kontaktdaten, Hausordnung, Ausstattung, Fotos und Pflegegrad-Eignung eurer Einrichtung.
        </p>
      </div>
      <FacilityContactForm
        facility={facility}
        pendingChangeRequest={facility.pendingChangeRequest}
      />
      <HouseRulesForm
        houseRules={{
          checkInTime: facility.checkInTime,
          checkOutTime: facility.checkOutTime,
          visitingHours: facility.visitingHours,
          wifiInfo: facility.wifiInfo,
          parkingInfo: facility.parkingInfo,
          petsPolicy: facility.petsPolicy,
          cancellationPolicyDays: facility.cancellationPolicyDays,
        }}
      />
      <AmenitiesEditor amenities={facility.amenities} />
      <PflegegradSuitabilityForm
        minPflegegrad={facility.minPflegegrad}
        maxPflegegrad={facility.maxPflegegrad}
      />
      <PhotoManager photos={facility.photos} />
    </>
  );
}
