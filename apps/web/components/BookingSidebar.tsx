"use client";

import { useState } from "react";
import { BookingRequestForm } from "./BookingRequestForm";
import { InstantBookingForm } from "./InstantBookingForm";
import type { BookingType } from "@woodaa/validators";

export function BookingSidebar({
  facilityId,
  availableBookingTypes,
}: {
  facilityId: string;
  availableBookingTypes: BookingType[];
}) {
  const [mode, setMode] = useState<"book" | "inquire">("book");

  if (mode === "inquire") {
    return (
      <div className="flex flex-col gap-3">
        <BookingRequestForm facilityId={facilityId} availableBookingTypes={availableBookingTypes} />
        <button
          type="button"
          onClick={() => setMode("book")}
          className="text-sm text-brand-text-muted underline hover:text-brand-text"
        >
          Doch lieber direkt verbindlich buchen
        </button>
      </div>
    );
  }

  return (
    <InstantBookingForm
      facilityId={facilityId}
      availableBookingTypes={availableBookingTypes}
      onWantsToInquireInstead={() => setMode("inquire")}
    />
  );
}
