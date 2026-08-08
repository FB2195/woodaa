"use client";

import { useState } from "react";
import type { BookingType, PaymentMethod, Pflegegrad } from "@woodaa/validators";
import { CancelBookingBox } from "@/components/CancelBookingBox";
import { DateRangeCalendar } from "@/components/booking/DateRangeCalendar";
import { KostenuebernahmeUpload } from "@/components/booking/KostenuebernahmeUpload";
import { StripePaymentStep } from "@/components/booking/StripePaymentStep";
import { bookingTypeLabels, dateRangedBookingTypes, openEndedBookingTypes } from "@/lib/bookingTypeLabels";
import { formatPriceEuro } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/paymentMethodLabels";
import {
  calculateKurzzeitpflegeEigenanteil,
  calculateStationaerEigenanteil,
  calculateTagesNachtpflegeEigenanteil,
} from "@/lib/pflegekassenZuschuss";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";

// Deliberately minimal, hand-written types rather than RouterOutputs -
// this component receives props directly from a Server Component (real
// Date objects, no HTTP/JSON round trip in between), while RouterOutputs
// reflects the client's post-serialization (stringified dates) shape.
type PflegegradRate = {
  pflegegrad: number;
  dailyRateCents: number | null;
  monthlyRateCents: number | null;
  hourlyRateCents: number | null;
};
type Capacity = {
  bookingType: BookingType;
  monthlyPriceCents: number | null;
  minStayNights: number | null;
  pflegegradPricing: PflegegradRate[];
};
type Profile = {
  name: string;
  vorname: string;
  nachname: string;
  geburtsdatum: Date | null;
  street: string;
  postalCode: string;
  city: string;
  phone: string;
  versicherungsnummer: string | null;
  pflegegrad: number | null;
  pflegegradAntragLaeuft: boolean;
  krankenkasse: string | null;
  careRecipientName: string | null;
  isBevollmaechtigt: boolean;
};

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

// Below the payment section, per Pflegegrad/Zeitraum - example wording and
// the "ohne Gewähr" disclaimer are a deliberate product requirement, not
// just a UI nicety. Which fields/period this needs depends on bookingType -
// see CapacityPflegegradPricing in schema.prisma.
function SubsidyHint({
  bookingType,
  pflegegrad,
  rate,
  days,
  hoursPerDay,
}: {
  bookingType: BookingType;
  pflegegrad: Pflegegrad;
  rate: PflegegradRate;
  days: number | null;
  hoursPerDay: number;
}) {
  const disclaimer = (
    <>
      <p className="mt-1">
        Meist zahlst du den Betrag zunächst vollständig und bekommst den Zuschuss
        anschließend von deiner Pflegekasse erstattet.
      </p>
      <p className="mt-1 font-semibold">
        Alle Angaben ohne Gewähr - unverbindliche Orientierung, die tatsächliche Höhe
        bestätigt eure Pflegekasse.
      </p>
    </>
  );

  if (bookingType === "STATIONAERE_AUFNAHME") {
    const result = calculateStationaerEigenanteil(pflegegrad, rate);
    if (!result) return null;
    return (
      <div className="rounded-brand-md bg-brand-background p-3 text-xs text-brand-text-muted">
        <p>
          Ihre Krankenkasse beteiligt sich an den Kosten bis zu {formatPriceEuro(result.subsidyCents)}{" "}
          pro Monat. Ihr voraussichtlicher Eigenanteil beträgt damit{" "}
          {formatPriceEuro(result.eigenanteilCents)} pro Monat.
        </p>
        {result.note && <p className="mt-1">{result.note}</p>}
        {disclaimer}
      </div>
    );
  }

  if (bookingType === "KURZZEITPFLEGE") {
    if (rate.dailyRateCents === null || days === null) return null;
    const result = calculateKurzzeitpflegeEigenanteil(pflegegrad, rate.dailyRateCents, days);
    return (
      <div className="rounded-brand-md bg-brand-background p-3 text-xs text-brand-text-muted">
        <p>
          Ihre Krankenkasse beteiligt sich an den Kosten für Ihre Kurzzeitpflege. Grundsätzlich
          verfügbar sind bis zu {formatPriceEuro(result.jahresbudgetCents)} pro Kalenderjahr. Für
          {` ${days} Tage`} kostet das Heim {formatPriceEuro(result.totalCostCents)}, wovon die
          Kasse {formatPriceEuro(result.subsidyCents)} übernimmt. Ihr voraussichtlicher
          Eigenanteil beträgt damit {formatPriceEuro(result.eigenanteilCents)} - danach stehen
          noch {formatPriceEuro(result.remainingBudgetCents)} Jahresbudget zur Verfügung.
        </p>
        {result.note && <p className="mt-1">{result.note}</p>}
        {disclaimer}
      </div>
    );
  }

  // TAGESPFLEGE / NACHTPFLEGE
  if (rate.hourlyRateCents === null) return null;
  const result = calculateTagesNachtpflegeEigenanteil(pflegegrad, rate.hourlyRateCents, hoursPerDay);
  return (
    <div className="rounded-brand-md bg-brand-background p-3 text-xs text-brand-text-muted">
      <p>
        Ihre Krankenkasse beteiligt sich an den Kosten mit bis zu{" "}
        {formatPriceEuro(result.dailySubsidyCents)} pro Tag. Ihr voraussichtlicher Eigenanteil
        beträgt damit {formatPriceEuro(result.dailyEigenanteilCents)} pro Tag (bei{" "}
        {hoursPerDay} Std./Tag).
      </p>
      {result.note && <p className="mt-1">{result.note}</p>}
      {disclaimer}
    </div>
  );
}

export function BookingForm({
  facilityId,
  capacities,
  profile,
  cancellationPolicyDays,
}: {
  facilityId: string;
  capacities: Capacity[];
  profile: Profile;
  // null = Einrichtung hat keine Angabe gemacht - dann generischer Text statt
  // eines konkreten Fristwerts. Rein informativ: cancelBooking erstattet
  // immer voll, unabhängig von dieser Frist (siehe der Kommentar dort).
  cancellationPolicyDays: number | null;
}) {
  const [bookingType, setBookingType] = useState<BookingType | undefined>(
    capacities[0]?.bookingType,
  );
  const [pflegegrad, setPflegegrad] = useState<Pflegegrad | "">(
    (profile.pflegegrad as Pflegegrad | null) ?? "",
  );
  const [endeOffen, setEndeOffen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("KARTE");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const createBooking = trpc.booking.create.useMutation();

  // Falls die Einrichtung keine eigene Stornofrist hinterlegt hat (siehe
  // Facility.cancellationPolicyDays), bleibt der bisherige generische 48h-
  // Hinweis als Fallback erhalten statt einer falschen konkreten Angabe.
  const cancellationDaysLabel =
    cancellationPolicyDays !== null
      ? `${cancellationPolicyDays} ${cancellationPolicyDays === 1 ? "Tag" : "Tage"}`
      : "48 Std.";

  // Bevollmächtigte/r: prefill with the care recipient's name, not the
  // account holder's own name/address (profile.vorname/street/...) - see
  // VollmachtSection.tsx. The care recipient's birth date/address/phone
  // aren't on file anywhere (only their name), so those inputs stay blank
  // for a Bevollmächtigte/r to fill in fresh every time.
  const prefillAsAccountHolder = !profile.isBevollmaechtigt;
  const { firstName, lastName } =
    prefillAsAccountHolder && (profile.vorname || profile.nachname)
      ? { firstName: profile.vorname, lastName: profile.nachname }
      : splitName(
          profile.isBevollmaechtigt && profile.careRecipientName
            ? profile.careRecipientName
            : profile.name,
        );
  const birthDateDefault =
    prefillAsAccountHolder && profile.geburtsdatum
      ? profile.geburtsdatum.toISOString().slice(0, 10)
      : "";
  const isDateRanged = bookingType ? dateRangedBookingTypes.includes(bookingType) : false;
  const allowsOpenEnd = bookingType ? openEndedBookingTypes.includes(bookingType) : false;
  const isStationaer = bookingType === "STATIONAERE_AUFNAHME";
  const isKurzzeitpflege = bookingType === "KURZZEITPFLEGE";
  const isTagesNachtpflege = bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE";
  const capacity = capacities.find((c) => c.bookingType === bookingType);
  const rate =
    pflegegrad === "" ? undefined : capacity?.pflegegradPricing.find((r) => r.pflegegrad === pflegegrad);

  const days =
    isDateRanged && !endeOffen && startDate && endDate
      ? Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000),
        ) + 1
      : null;

  // Nächte, nicht Kalendertage (anders als `days` oben, das für die
  // Zuschuss-Vorschau bewusst inklusiv beide Tage zählt) - der
  // Mindestaufenthalt einer Einrichtung ist als Nächte konfiguriert.
  const nights =
    isKurzzeitpflege && startDate && endDate
      ? Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000),
        )
      : null;
  const minStayNights = isKurzzeitpflege ? (capacity?.minStayNights ?? null) : null;
  const belowMinStay =
    minStayNights !== null && nights !== null && nights < minStayNights;

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
    const { booking, stripeClientSecret } = createBooking.data;

    if (stripeClientSecret && !paymentConfirmed) {
      return (
        <div className="mt-6 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
          <p className="font-semibold text-brand-heading">
            Dein Platz ist reserviert - jetzt bezahlen
          </p>
          <p className="mt-1 text-sm text-brand-text-muted">
            Der Platz ist für dich vorgemerkt. Schließe die Zahlung ab, um die Buchung
            verbindlich zu machen.
          </p>
          <div className="mt-4">
            <StripePaymentStep
              clientSecret={stripeClientSecret}
              onConfirmed={() => setPaymentConfirmed(true)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="mt-6 rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
        <p className="font-semibold text-brand-heading">Platz gebucht!</p>
        <p className="mt-1 text-sm text-brand-text-muted">
          Dein Platz ist reserviert. Die Einrichtung wurde informiert und meldet sich bei
          Rückfragen direkt bei dir.
        </p>
        {booking.paymentMethod === "RECHNUNG" && (
          <p className="mt-2 text-sm text-brand-text-muted">
            Die Einrichtung prüft die Buchung und gibt die Rechnungsstellung frei - du hörst
            in Kürze von ihr.
          </p>
        )}
        {booking.paymentMethod === "KOSTENUEBERNAHME_KASSE" && (
          <KostenuebernahmeUpload bookingId={booking.id} />
        )}
        {booking.adminApprovalStatus === "AUSSTEHEND" && (
          <p className="mt-2 text-sm text-brand-text-muted">
            Da du als bevollmächtigte/r Angehörige/r buchst, prüft unser Team diese
            Buchung noch zusätzlich - du hörst in Kürze von uns.
          </p>
        )}
        <CancelBookingBox bookingId={booking.id} />
      </div>
    );
  }

  return (
    <form
      className="mt-6 flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setClientError(null);
        if (!bookingType) return;
        if (belowMinStay) {
          setClientError(
            `Diese Einrichtung erfordert bei Kurzzeitpflege einen Mindestaufenthalt von ${minStayNights} Nächten - der gewählte Zeitraum umfasst nur ${nights} ${nights === 1 ? "Nacht" : "Nächte"}.`,
          );
          return;
        }
        const form = new FormData(event.currentTarget);
        const get = (name: string) => String(form.get(name) ?? "").trim();
        const desiredStartDateRaw = get("desiredStartDate");
        const pflegegradRaw = get("pflegegrad");

        createBooking.mutate({
          facilityId,
          bookingType,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: !endeOffen && endDate ? new Date(endDate).toISOString() : undefined,
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
          paymentMethod,
          hoursPerDay: isTagesNachtpflege ? hoursPerDay : undefined,
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
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-brand-text">
              Bis
              <input
                type="date"
                name="endDate"
                required={!(allowsOpenEnd && endeOffen)}
                disabled={allowsOpenEnd && endeOffen}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-brand-background disabled:text-brand-text-muted"
              />
            </label>
          </div>

          {isKurzzeitpflege && minStayNights !== null && (
            <p className={`text-xs ${belowMinStay ? "text-red-600" : "text-brand-text-muted"}`}>
              Mindestaufenthalt bei dieser Einrichtung: {minStayNights}{" "}
              {minStayNights === 1 ? "Nacht" : "Nächte"}
              {nights !== null &&
                ` (gewählter Zeitraum: ${nights} ${nights === 1 ? "Nacht" : "Nächte"})`}
            </p>
          )}

          <DateRangeCalendar
            startDate={startDate}
            endDate={endDate}
            onChange={(newStart, newEnd) => {
              setStartDate(newStart);
              setEndDate(newEnd);
            }}
            disabled={allowsOpenEnd && endeOffen}
          />

          {allowsOpenEnd && (
            <label className="flex items-center gap-2 text-sm text-brand-text">
              <input
                type="checkbox"
                checked={endeOffen}
                onChange={(event) => setEndeOffen(event.target.checked)}
              />
              Vorerst ohne Enddatum (regelmäßig, bis auf Weiteres)
            </label>
          )}
        </div>
      )}

      {isTagesNachtpflege && (
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Stunden pro Tag
          <input
            type="number"
            min={1}
            max={24}
            value={hoursPerDay}
            onChange={(event) => setHoursPerDay(Math.max(1, Number(event.target.value) || 1))}
            className="w-24 rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
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
          defaultValue={birthDateDefault}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Straße & Hausnummer
        <input
          name="guestStreet"
          required
          defaultValue={prefillAsAccountHolder ? profile.street : ""}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          PLZ
          <input
            name="guestPostalCode"
            required
            defaultValue={prefillAsAccountHolder ? profile.postalCode : ""}
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Stadt
          <input
            name="guestCity"
            required
            defaultValue={prefillAsAccountHolder ? profile.city : ""}
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
          defaultValue={prefillAsAccountHolder ? profile.phone : ""}
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

      {bookingType && pflegegrad !== "" && rate && (
        <SubsidyHint
          bookingType={bookingType}
          pflegegrad={pflegegrad}
          rate={rate}
          days={days}
          hoursPerDay={hoursPerDay}
        />
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-brand-text">Zahlungsart</legend>
        {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
          <label key={method} className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === method}
              onChange={() => setPaymentMethod(method)}
            />
            {paymentMethodLabels[method]}
          </label>
        ))}
        {paymentMethod === "RECHNUNG" && (
          <p className="text-xs text-brand-text-muted">
            Die Rechnung wird über die Einrichtung abgewickelt - sie muss diese Zahlungsart
            für deine Buchung erst freigeben.
          </p>
        )}
        {paymentMethod === "KOSTENUEBERNAHME_KASSE" && (
          <p className="text-xs text-brand-text-muted">
            Zahlt deine Pflegekasse die Einrichtung direkt, lädst du im nächsten Schritt die
            Kostenübernahmebestätigung hoch - auch das muss die Einrichtung freigeben.
          </p>
        )}
      </fieldset>

      {profile.isBevollmaechtigt && (
        <p className="text-xs text-brand-text-muted">
          Da du als bevollmächtigte/r Angehörige/r buchst, prüft unser Team diese Buchung
          zusätzlich, bevor sie endgültig bestätigt wird.
        </p>
      )}

      <p className="text-xs text-brand-text-muted">
        Storno: Bis {cancellationDaysLabel} vorher kannst du kostenlos stornieren.
      </p>

      {clientError && <p className="text-sm text-red-600">{clientError}</p>}
      {createBooking.isError && (
        <p className="text-sm text-red-600">{createBooking.error.message}</p>
      )}

      <button
        type="submit"
        disabled={createBooking.isPending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {createBooking.isPending ? "Wird gebucht…" : "Verbindlich und zahlungspflichtig buchen"}
      </button>
      <p className="-mt-2 text-center text-xs text-brand-text-muted">
        Kein Risiko, bis zu {cancellationDaysLabel} vorher können Sie kostenfrei stornieren.
      </p>
    </form>
  );
}
