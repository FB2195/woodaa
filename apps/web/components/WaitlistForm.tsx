"use client";

import { useState } from "react";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { trpc } from "@/lib/trpc";
import type { BookingType } from "@woodaa/validators";

// Offered when a facility (or a specific bookingType of it) currently has
// no free capacity - the "keine freien Plätze" dead end that used to be the
// only thing shown there. Mirrors BookingRequestForm closely (same public,
// no-login lead-capture shape), see waitlist.create/WaitlistEntry.
export function WaitlistForm({
  facilityId,
  bookingTypes,
  compact = false,
}: {
  facilityId: string;
  bookingTypes: BookingType[];
  // Used for the small inline per-row variant on the facility page's
  // Verfügbarkeit list, where only a single bookingType is relevant and
  // space is tight - drops the heading and shrinks the padding.
  compact?: boolean;
}) {
  const [bookingType, setBookingType] = useState<BookingType | undefined>(bookingTypes[0]);
  const join = trpc.waitlist.create.useMutation();

  if (bookingTypes.length === 0) return null;

  if (join.isSuccess) {
    return (
      <div
        className={
          compact
            ? "rounded-brand-md bg-brand-accent/10 p-3 text-sm text-brand-text"
            : "rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6"
        }
      >
        <p className="font-semibold text-brand-heading">Auf der Warteliste!</p>
        <p className="mt-1 text-sm text-brand-text-muted">
          Wir melden uns per E-Mail, sobald ein Platz frei wird.
        </p>
      </div>
    );
  }

  return (
    <form
      className={
        compact
          ? "flex flex-col gap-3 rounded-brand-md border border-brand-border bg-brand-background p-3"
          : "flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      }
      onSubmit={(event) => {
        event.preventDefault();
        if (!bookingType) return;
        const form = new FormData(event.currentTarget);
        join.mutate({
          facilityId,
          bookingType,
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? "") || undefined,
          message: String(form.get("message") ?? "") || undefined,
        });
      }}
    >
      {!compact && <h3 className="text-lg font-semibold text-brand-heading">Auf die Warteliste</h3>}
      <p className="text-sm text-brand-text-muted">
        Aktuell kein freier Platz{bookingTypes.length === 1 ? "" : " für die gewählte Leistung"} -
        wir informieren dich per E-Mail, sobald einer frei wird.
      </p>

      {bookingTypes.length > 1 && (
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Pflegeart
          <select
            value={bookingType}
            onChange={(event) => setBookingType(event.target.value as BookingType)}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            {bookingTypes.map((type) => (
              <option key={type} value={type}>
                {bookingTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Name
        <input
          name="name"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        E-Mail
        <input
          type="email"
          name="email"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      {!compact && (
        <>
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Telefon (optional)
            <input
              type="tel"
              name="phone"
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Nachricht (optional)
            <textarea
              name="message"
              rows={3}
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        </>
      )}

      {join.isError && (
        <p className="text-sm text-red-600">
          Da ist etwas schiefgelaufen. Bitte versuch es noch einmal.
        </p>
      )}

      <button
        type="submit"
        disabled={join.isPending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {join.isPending ? "Wird gesendet…" : "Auf die Warteliste"}
      </button>
    </form>
  );
}
