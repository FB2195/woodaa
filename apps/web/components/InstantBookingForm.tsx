"use client";

import { useState } from "react";
import { bookingTypeLabels, dateRangedBookingTypes } from "@/lib/bookingTypeLabels";
import { trpc } from "@/lib/trpc";

type AvailableBookingType = keyof typeof bookingTypeLabels;

function CancelBookingBox({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const cancel = trpc.booking.cancel.useMutation();

  if (cancel.isSuccess) {
    return <p className="mt-3 text-sm text-brand-text-muted">Buchung storniert.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm text-brand-text-muted underline hover:text-red-600"
      >
        Doch stornieren?
      </button>
    );
  }

  return (
    <form
      className="mt-3 flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        cancel.mutate({ bookingId, guestEmail: String(form.get("guestEmail") ?? "") });
      }}
    >
      <input
        type="email"
        name="guestEmail"
        required
        placeholder="Deine E-Mail zur Bestätigung"
        className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
      <button
        type="submit"
        disabled={cancel.isPending}
        className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text-muted hover:text-red-600 disabled:opacity-50"
      >
        {cancel.isPending ? "…" : "Stornieren"}
      </button>
      {cancel.isError && <p className="text-sm text-red-600">E-Mail stimmt nicht überein.</p>}
    </form>
  );
}

export function InstantBookingForm({
  facilityId,
  availableBookingTypes,
  onWantsToInquireInstead,
}: {
  facilityId: string;
  availableBookingTypes: AvailableBookingType[];
  onWantsToInquireInstead: () => void;
}) {
  const [bookingType, setBookingType] = useState<AvailableBookingType | undefined>(
    availableBookingTypes[0],
  );
  const createBooking = trpc.booking.create.useMutation();
  const isDateRanged = bookingType ? dateRangedBookingTypes.includes(bookingType) : false;

  if (availableBookingTypes.length === 0) {
    return (
      <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
        Diese Einrichtung hat aktuell keine freien Plätze.
      </p>
    );
  }

  if (createBooking.isSuccess) {
    return (
      <div className="rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
        <p className="font-semibold text-brand-primary-dark">Platz gebucht!</p>
        <p className="mt-1 text-sm text-brand-text-muted">
          Dein Platz ist reserviert. Die Einrichtung wurde informiert und meldet sich bei
          Rückfragen direkt bei dir.
        </p>
        <CancelBookingBox bookingId={createBooking.data.id} />
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!bookingType) return;
        const form = new FormData(event.currentTarget);
        const startDateRaw = String(form.get("startDate") ?? "");
        const endDateRaw = String(form.get("endDate") ?? "");
        createBooking.mutate({
          facilityId,
          bookingType,
          guestName: String(form.get("guestName") ?? ""),
          guestEmail: String(form.get("guestEmail") ?? ""),
          guestPhone: String(form.get("guestPhone") ?? "") || undefined,
          startDate: startDateRaw ? new Date(startDateRaw).toISOString() : undefined,
          endDate: endDateRaw ? new Date(endDateRaw).toISOString() : undefined,
        });
      }}
    >
      <h3 className="text-lg font-semibold text-brand-primary-dark">Jetzt buchen</h3>
      <p className="text-sm text-brand-text-muted">
        Deine Buchung ist sofort verbindlich - ein Platz wird direkt für dich reserviert.
      </p>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Pflegeart
        <select
          value={bookingType}
          onChange={(event) => setBookingType(event.target.value as AvailableBookingType)}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {availableBookingTypes.map((type) => (
            <option key={type} value={type}>
              {bookingTypeLabels[type]}
            </option>
          ))}
        </select>
      </label>

      {isDateRanged && (
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm text-brand-text">
            Von
            <input
              type="date"
              name="startDate"
              required
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm text-brand-text">
            Bis
            <input
              type="date"
              name="endDate"
              required
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Name
        <input
          name="guestName"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        E-Mail
        <input
          type="email"
          name="guestEmail"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Telefon (optional)
        <input
          type="tel"
          name="guestPhone"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      {createBooking.isError && (
        <p className="text-sm text-red-600">{createBooking.error.message}</p>
      )}

      <button
        type="submit"
        disabled={createBooking.isPending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {createBooking.isPending ? "Wird gebucht…" : "Verbindlich buchen"}
      </button>

      <button
        type="button"
        onClick={onWantsToInquireInstead}
        className="text-sm text-brand-text-muted underline hover:text-brand-text"
      >
        Ich möchte erst unverbindlich anfragen
      </button>
    </form>
  );
}
