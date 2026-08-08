"use client";

import { useState } from "react";
import { WaitlistForm } from "./WaitlistForm";
import type { BookingType } from "@woodaa/validators";

// Small inline "Auf die Warteliste" link on a single Verfügbarkeit row
// (facility page) - separate from BookingSidebar's full-form variant, which
// only covers the case where NO bookingType has availability. This one
// handles the partial case: some booking types are free, this specific one
// isn't.
export function WaitlistRowCTA({
  facilityId,
  bookingType,
}: {
  facilityId: string;
  bookingType: BookingType;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="mt-2">
        <WaitlistForm facilityId={facilityId} bookingTypes={[bookingType]} compact />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="mt-2 text-sm text-brand-accent underline hover:opacity-80"
    >
      Auf die Warteliste
    </button>
  );
}
