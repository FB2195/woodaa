"use client";

import { useState } from "react";
import type { BookingType, Pflegegrad } from "@woodaa/validators";
import { CancelBookingBox } from "@/components/CancelBookingBox";
import { bookingTypeLabels, dateRangedBookingTypes } from "@/lib/bookingTypeLabels";
import { formatPriceEuro } from "@/lib/format";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";

// Deliberately minimal, hand-written types rather than RouterOutputs -
// this component receives props directly from a Server Component (real
// Date objects, no HTTP/JSON round trip in between), while RouterOutputs
// reflects the client's post-serialization (stringified dates) shape.
type Capacity = {
  bookingType: BookingType;
  monthlyPriceCents: number | null;
};
type Profile = {
  name: string;
  versicherungsnummer: string | null;
  pflegegrad: number | null;
  pflegegradAntragLaeuft: boolean;
  krankenkasse: string | null;
};

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export function BookingForm({
  facilityId,
  capacities,
  profile,
}: {
  facilityId: string;
  capacities: Capacity[];
  profile: Profile;
}) {
  const [bookingType, setBookingType] = useState<BookingType | undefined>(
    capacities[0]?.bookingType,
  );
  const [pflegegrad, setPflegegrad] = useState<Pflegegrad | "">(
    (profile.pflegegrad as Pflegegrad | null) ?? "",
  );
  const [endeOffen, setEndeOffen] = useState(false);
  const createBooking = trpc.booking.create.useMutation();

  const { firstName, lastName } = splitName(profile.name);
  const isDateRanged = bookingType ? dateRangedBookingTypes.includes(bookingType) : false;
  const isStationaer = bookingType === "STATIONAERE_AUFNAHME";
  const capacity = capacities.find((c) => c.bookingType === bookingType);

  const pflegegradAntragLabel =
    pflegegrad === "" || pflegegrad === 0
      ? "Pflegegrad bereits beantragt"
      : "Erhöhung des Pflegegrades beantragt";

  if (capacities.length === 0) {
    return (
      <p className="mt-6 rounded-brand-lg border border-brand-border bg-brand-surface p-6 text-sm text-brand-text-muted">
        Diese Einrichtung hat aktuell keine freien Plätze.
      </p>
    );
  }

  if (createBooking.isSuccess) {
    return (
      <div className="mt-6 rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
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
      className="mt-6 flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!bookingType) return;
        const form = new FormData(event.currentTarget);
        const get = (name: string) => String(form.get(name) ?? "").trim();
        const startDateRaw = get("startDate");
        const endDateRaw = endeOffen ? "" : get("endDate");
        const desiredStartDateRaw = get("desiredStartDate");
        const pflegegradRaw = get("pflegegrad");

        createBooking.mutate({
          facilityId,
          bookingType,
          startDate: startDateRaw ? new Date(startDateRaw).toISOString() : undefined,
          endDate: endDateRaw ? new Date(endDateRaw).toISOString() : undefined,
          desiredStartDate: desiredStartDateRaw
            ? new Date(desiredStartDateRaw).toISOString()
            : undefined,
          guestFirstName: get("guestFirstName"),
          guestLastName: get("guestLastName"),
          guestBirthDate: new Date(get("guestBirthDate")).toISOString(),
          guestStreet: get("guestStreet"),
          guestPostalCode: get("guestPostalCode"),
          guestCity: get("guestCity"),
          krankenkasse: get("krankenkasse"),
          versicherungsnummer: get("versicherungsnummer"),
          pflegegrad: Number(pflegegradRaw) as Pflegegrad,
          pflegegradAntragLaeuft: form.get("pflegegradAntragLaeuft") === "on",
          guestPhone: get("guestPhone") || undefined,
          note: get("note") || undefined,
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Pflegeart
        <select
          value={bookingType}
          onChange={(event) => setBookingType(event.target.value as BookingType)}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {capacities.map((c) => (
            <option key={c.bookingType} value={c.bookingType}>
              {bookingTypeLabels[c.bookingType]}
            </option>
          ))}
        </select>
        {capacity?.monthlyPriceCents != null && (
          <span className="text-xs text-brand-text-muted">
            {formatPriceEuro(capacity.monthlyPriceCents)}/Monat (Heimpreis vor
            Pflegekassen-Zuschuss)
          </span>
        )}
      </label>

      {isStationaer && (
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Gewünschtes Aufnahmedatum (optional)
          <input
            type="date"
            name="desiredStartDate"
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      )}

      {isDateRanged && (
        <div className="flex flex-col gap-2">
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
                required={!endeOffen}
                disabled={endeOffen}
                className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-brand-background disabled:text-brand-text-muted"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={endeOffen}
              onChange={(event) => setEndeOffen(event.target.checked)}
            />
            Vorerst ohne Enddatum (regelmäßig, bis auf Weiteres)
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Vorname
          <input
            name="guestFirstName"
            required
            defaultValue={firstName}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Nachname
          <input
            name="guestLastName"
            required
            defaultValue={lastName}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Geburtsdatum
        <input
          type="date"
          name="guestBirthDate"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Straße & Hausnummer
        <input
          name="guestStreet"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          PLZ
          <input
            name="guestPostalCode"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Stadt
          <input
            name="guestCity"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Krankenkasse
        <input
          name="krankenkasse"
          required
          defaultValue={profile.krankenkasse ?? ""}
          placeholder="z. B. AOK, TK, Barmer…"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Versicherungsnummer
        <input
          name="versicherungsnummer"
          required
          defaultValue={profile.versicherungsnummer ?? ""}
          placeholder="z. B. A123456789"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Pflegegrad
        <select
          name="pflegegrad"
          required
          value={pflegegrad}
          onChange={(event) =>
            setPflegegrad(
              event.target.value === "" ? "" : (Number(event.target.value) as Pflegegrad),
            )
          }
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          <option value="">Bitte wählen</option>
          {pflegegradOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-brand-text">
        <input
          type="checkbox"
          name="pflegegradAntragLaeuft"
          defaultChecked={profile.pflegegradAntragLaeuft}
        />
        {pflegegradAntragLabel}
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Telefon (optional)
        <input
          type="tel"
          name="guestPhone"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Nachricht an die Einrichtung (optional)
        <textarea
          name="note"
          rows={3}
          placeholder="Gibt es etwas, das die Einrichtung vorab wissen sollte?"
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
    </form>
  );
}
