"use client";

import Image from "next/image";
import Link from "next/link";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";
import { trpc } from "@/lib/trpc";
// Type-only import - erased at build time, safe to pull into a client
// component despite trpc-server.ts otherwise being server-only. Reflects
// the client's post-JSON-serialization shape (stringified dates), unlike
// the Date-typed MyBooking exported from @woodaa/api - see BookingForm.tsx
// for the same distinction.
import type { RouterOutputs } from "@/lib/trpc-server";

export type MyBooking = RouterOutputs["booking"]["myBookings"][number];

export const facilityApprovalLabels: Record<string, { text: string; className: string }> = {
  AUSSTEHEND: {
    text: "Bestätigung durch die Einrichtung ausstehend",
    className: "bg-amber-100 text-amber-700",
  },
  BESTAETIGT: {
    text: "Von der Einrichtung bestätigt",
    className: "bg-brand-accent/10 text-brand-accent",
  },
  ABGELEHNT: {
    text: "Von der Einrichtung abgelehnt",
    className: "bg-red-100 text-red-700",
  },
};

function BookingCard({ booking }: { booking: MyBooking }) {
  const isCancelled = booking.status === "STORNIERT";
  const facilityApproval =
    booking.facilityApprovalStatus !== "NICHT_ERFORDERLICH"
      ? facilityApprovalLabels[booking.facilityApprovalStatus]
      : null;
  const coverPhoto = booking.facility.photos[0] ?? null;

  return (
    <Link
      href={`/konto/buchungen/${booking.id}`}
      className="flex gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-md"
    >
      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-brand-md">
        {coverPhoto?.url ? (
          <Image
            src={coverPhoto.url}
            alt=""
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <PlaceholderPhoto
            category={coverPhoto?.category ?? "AUSSENANSICHT"}
            seed={booking.facility.slug}
            className="absolute inset-0 h-full w-full"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <p className="truncate font-semibold text-brand-heading">{booking.facility.name}</p>
          <p className="truncate text-sm text-brand-text-muted">
            {booking.facility.postalCode} {booking.facility.city}
          </p>
          <p className="mt-1 text-sm text-brand-text-muted">
            {bookingTypeLabels[booking.bookingType]}
            {booking.startDate &&
              ` · ${formatDate(booking.startDate)}${booking.endDate ? ` – ${formatDate(booking.endDate)}` : ""}`}
          </p>
        </div>

        <div>
          {isCancelled ? (
            <span className="inline-block rounded-brand-full bg-brand-border px-2 py-0.5 text-xs font-medium text-brand-text-muted">
              Storniert
            </span>
          ) : (
            facilityApproval && (
              <span
                className={`inline-block rounded-brand-full px-2 py-0.5 text-xs font-medium ${facilityApproval.className}`}
              >
                {facilityApproval.text}
              </span>
            )
          )}
        </div>
      </div>
    </Link>
  );
}

export function MyBookingsSection() {
  const { data, isLoading } = trpc.booking.myBookings.useQuery();

  if (isLoading || !data) return null;

  if (data.length === 0) {
    return <p className="text-sm text-brand-text-muted">Du hast noch keine Buchung vorgenommen.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.map((booking) => (
        <li key={booking.id}>
          <BookingCard booking={booking} />
        </li>
      ))}
    </ul>
  );
}
