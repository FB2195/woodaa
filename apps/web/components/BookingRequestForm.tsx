"use client";

import { useState } from "react";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { trpc } from "@/lib/trpc";

type AvailableBookingType = keyof typeof bookingTypeLabels;

export function BookingRequestForm({
  facilityId,
  availableBookingTypes,
}: {
  facilityId: string;
  availableBookingTypes: AvailableBookingType[];
}) {
  const [bookingType, setBookingType] = useState<
    AvailableBookingType | undefined
  >(availableBookingTypes[0]);
  const createRequest = trpc.bookingRequest.create.useMutation();

  if (availableBookingTypes.length === 0) {
    return (
      <p className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
        Diese Einrichtung hat aktuell keine freien Plätze.
      </p>
    );
  }

  if (createRequest.isSuccess) {
    return (
      <div className="rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
        <p className="font-semibold text-brand-heading">
          Anfrage gesendet!
        </p>
        <p className="mt-1 text-sm text-brand-text-muted">
          Die Einrichtung meldet sich in der Regel innerhalb weniger Tage
          direkt bei dir.
        </p>
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
        createRequest.mutate({
          facilityId,
          bookingType,
          requesterName: String(form.get("requesterName") ?? ""),
          requesterEmail: String(form.get("requesterEmail") ?? ""),
          requesterPhone: String(form.get("requesterPhone") ?? "") || undefined,
          message: String(form.get("message") ?? "") || undefined,
        });
      }}
    >
      <h3 className="text-lg font-semibold text-brand-heading">
        Anfrage senden
      </h3>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Pflegeart
        <select
          value={bookingType}
          onChange={(event) =>
            setBookingType(event.target.value as AvailableBookingType)
          }
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {availableBookingTypes.map((type) => (
            <option key={type} value={type}>
              {bookingTypeLabels[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Name
        <input
          name="requesterName"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        E-Mail
        <input
          type="email"
          name="requesterEmail"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Telefon (optional)
        <input
          type="tel"
          name="requesterPhone"
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

      {createRequest.isError && (
        <p className="text-sm text-red-600">
          Da ist etwas schiefgelaufen. Bitte versuch es noch einmal.
        </p>
      )}

      <button
        type="submit"
        disabled={createRequest.isPending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {createRequest.isPending ? "Wird gesendet…" : "Anfrage senden"}
      </button>
    </form>
  );
}
