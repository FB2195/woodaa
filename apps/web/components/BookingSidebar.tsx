"use client";

import { useState } from "react";
import Link from "next/link";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { BookingRequestForm } from "./BookingRequestForm";
import { WaitlistForm } from "./WaitlistForm";
import type { BookingType } from "@woodaa/validators";

export function BookingSidebar({
  facilityId,
  slug,
  availableBookingTypes,
  allBookingTypes,
}: {
  facilityId: string;
  slug: string;
  availableBookingTypes: BookingType[];
  // Every bookingType the facility offers at all (available or not) - only
  // needed for the fully-booked case below, to offer a waitlist spot for
  // each one instead of the dead end this used to be.
  allBookingTypes: BookingType[];
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

  if (availableBookingTypes.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
          Diese Einrichtung hat aktuell keine freien Plätze.
        </p>
        <WaitlistForm facilityId={facilityId} bookingTypes={allBookingTypes} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <h3 className="text-lg font-semibold text-brand-heading">Jetzt buchen</h3>
      <p className="text-sm text-brand-text-muted">
        Verfügbar für {availableBookingTypes.map((type) => bookingTypeLabels[type]).join(", ")}.
        Deine Buchung ist sofort verbindlich - ein Platz wird direkt für dich reserviert.
      </p>

      <Link
        href={`/einrichtung/${slug}/buchen`}
        className="rounded-brand-md bg-brand-accent px-6 py-3 text-center font-semibold text-white transition hover:opacity-90"
      >
        Pflegeplatz buchen
      </Link>

      <button
        type="button"
        onClick={() => setMode("inquire")}
        className="text-sm text-brand-text-muted underline hover:text-brand-text"
      >
        Ich möchte erst unverbindlich anfragen
      </button>
    </div>
  );
}
