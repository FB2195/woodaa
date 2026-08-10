import type { BookingType, PaymentMethod, Pflegegrad } from "@woodaa/validators";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Checkbox } from "@/components/Checkbox";
import { DateField } from "@/components/DateField";
import { DateRangeCalendar } from "@/components/booking/DateRangeCalendar";
import { KostenuebernahmeUpload } from "@/components/booking/KostenuebernahmeUpload";
import { StripePaymentStep } from "@/components/booking/StripePaymentStep";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SelectField } from "@/components/SelectField";
import { bookingTypeLabels, dateRangedBookingTypes, openEndedBookingTypes } from "@/lib/bookingTypeLabels";
import { formatPriceEuro } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/paymentMethodLabels";
import {
  calculateKurzzeitpflegeEigenanteil,
  calculateStationaerEigenanteil,
  calculateTagesNachtpflegeEigenanteil,
} from "@/lib/pflegekassenZuschuss";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { stripePublishableKey } from "@/lib/stripeConfig";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/app/einrichtung/[slug]/buchen/page.tsx +
// components/booking/BookingForm.tsx. Diverges from the web version in one
// deliberate way:
// - Payment: card/Klarna/PayPal go through Stripe's PaymentSheet (see
//   StripePaymentStep) instead of Stripe.js's <PaymentElement>, and are
//   hidden entirely if EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY isn't configured
//   (see lib/stripeConfig.ts) - Rechnung/Kostenübernahme need no Stripe key
//   and always work.

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function SubsidyHint({
  bookingType,
  pflegegrad,
  rate,
  days,
  hoursPerDay,
}: {
  bookingType: BookingType;
  pflegegrad: Pflegegrad;
  rate: { dailyRateCents: number | null; monthlyRateCents: number | null; hourlyRateCents: number | null };
  days: number | null;
  hoursPerDay: number;
}) {
  const disclaimer =
    "Meist zahlst du den Betrag zunächst vollständig und bekommst den Zuschuss anschließend " +
    "von deiner Pflegekasse erstattet. Alle Angaben ohne Gewähr - unverbindliche Orientierung, " +
    "die tatsächliche Höhe bestätigt eure Pflegekasse.";

  if (bookingType === "STATIONAERE_AUFNAHME") {
    const result = calculateStationaerEigenanteil(pflegegrad, rate);
    if (!result) return null;
    return (
      <View className="rounded-brand-md bg-brand-background p-3 dark:bg-brand-background-dark">
        <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          Ihre Krankenkasse beteiligt sich an den Kosten bis zu{" "}
          {formatPriceEuro(result.subsidyCents)} pro Monat. Ihr voraussichtlicher Eigenanteil
          beträgt damit {formatPriceEuro(result.eigenanteilCents)} pro Monat.
        </Text>
        {result.note && (
          <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
            {result.note}
          </Text>
        )}
        <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          {disclaimer}
        </Text>
      </View>
    );
  }

  if (bookingType === "KURZZEITPFLEGE") {
    if (rate.dailyRateCents === null || days === null) return null;
    const result = calculateKurzzeitpflegeEigenanteil(pflegegrad, rate.dailyRateCents, days);
    return (
      <View className="rounded-brand-md bg-brand-background p-3 dark:bg-brand-background-dark">
        <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          Grundsätzlich verfügbar sind bis zu {formatPriceEuro(result.jahresbudgetCents)} pro
          Kalenderjahr. Für {days} Tage kostet das Heim {formatPriceEuro(result.totalCostCents)},
          wovon die Kasse {formatPriceEuro(result.subsidyCents)} übernimmt. Ihr voraussichtlicher
          Eigenanteil beträgt damit {formatPriceEuro(result.eigenanteilCents)} - danach stehen
          noch {formatPriceEuro(result.remainingBudgetCents)} Jahresbudget zur Verfügung.
        </Text>
        {result.note && (
          <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
            {result.note}
          </Text>
        )}
        <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          {disclaimer}
        </Text>
      </View>
    );
  }

  if (rate.hourlyRateCents === null) return null;
  const result = calculateTagesNachtpflegeEigenanteil(pflegegrad, rate.hourlyRateCents, hoursPerDay);
  return (
    <View className="rounded-brand-md bg-brand-background p-3 dark:bg-brand-background-dark">
      <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
        Ihre Krankenkasse beteiligt sich an den Kosten mit bis zu{" "}
        {formatPriceEuro(result.dailySubsidyCents)} pro Tag. Ihr voraussichtlicher Eigenanteil
        beträgt damit {formatPriceEuro(result.dailyEigenanteilCents)} pro Tag (bei {hoursPerDay}{" "}
        Std./Tag).
      </Text>
      {result.note && (
        <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          {result.note}
        </Text>
      )}
      <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
        {disclaimer}
      </Text>
    </View>
  );
}

export default function BookingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const facilityQuery = trpc.facility.bySlug.useQuery({ slug });
  const profileQuery = trpc.careApplication.myCareProfile.useQuery();
  const createBooking = trpc.booking.create.useMutation();
  const cardPaymentAvailable = stripePublishableKey() !== null;

  const [bookingType, setBookingType] = useState<BookingType | null>(null);
  const [pflegegrad, setPflegegrad] = useState<Pflegegrad | null>(null);
  const [pflegegradAntragLaeuft, setPflegegradAntragLaeuft] = useState(false);
  const [endeOffen, setEndeOffen] = useState(false);
  const [desiredStartDate, setDesiredStartDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoursPerDay, setHoursPerDay] = useState("6");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestBirthDate, setGuestBirthDate] = useState<Date | null>(null);
  const [guestStreet, setGuestStreet] = useState("");
  const [guestPostalCode, setGuestPostalCode] = useState("");
  const [guestCity, setGuestCity] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [krankenkasse, setKrankenkasse] = useState("");
  const [versicherungsnummer, setVersicherungsnummer] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    cardPaymentAvailable ? "KARTE" : "RECHNUNG",
  );
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const facility = facilityQuery.data;
  const profile = profileQuery.data;
  const capacities = (facility?.capacities ?? []).filter((c) => c.availableSlots > 0);

  // Prefill once profile data has loaded (mirrors the web version's
  // server-rendered defaultValue - here it has to wait for the query and
  // run once, not on every profile refetch, so the user's own edits below
  // aren't clobbered).
  if (profile && !prefilled && bookingType === null) {
    const prefillAsAccountHolder = !profile.isBevollmaechtigt;
    const { firstName, lastName } =
      prefillAsAccountHolder && (profile.vorname || profile.nachname)
        ? { firstName: profile.vorname, lastName: profile.nachname }
        : splitName(
            profile.isBevollmaechtigt && profile.careRecipientName
              ? profile.careRecipientName
              : profile.name,
          );
    setGuestFirstName(firstName);
    setGuestLastName(lastName);
    if (prefillAsAccountHolder && profile.geburtsdatum) {
      setGuestBirthDate(new Date(profile.geburtsdatum));
    }
    if (prefillAsAccountHolder) {
      setGuestStreet(profile.street);
      setGuestPostalCode(profile.postalCode);
      setGuestCity(profile.city);
      setGuestPhone(profile.phone);
    }
    setKrankenkasse(profile.krankenkasse ?? "");
    setVersicherungsnummer(profile.versicherungsnummer ?? "");
    if (profile.pflegegrad !== null) setPflegegrad(profile.pflegegrad as Pflegegrad);
    setPflegegradAntragLaeuft(profile.pflegegradAntragLaeuft);
    setBookingType(capacities[0]?.bookingType ?? null);
    setPrefilled(true);
  }

  const isDateRanged = bookingType ? dateRangedBookingTypes.includes(bookingType) : false;
  const allowsOpenEnd = bookingType ? openEndedBookingTypes.includes(bookingType) : false;
  const isStationaer = bookingType === "STATIONAERE_AUFNAHME";
  const isKurzzeitpflege = bookingType === "KURZZEITPFLEGE";
  const isTagesNachtpflege = bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE";
  const capacity = capacities.find((c) => c.bookingType === bookingType);
  const rate =
    pflegegrad === null ? undefined : capacity?.pflegegradPricing.find((r) => r.pflegegrad === pflegegrad);

  const days =
    isDateRanged && !endeOffen && startDate && endDate
      ? Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
      : null;
  const nights =
    isKurzzeitpflege && startDate && endDate
      ? Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      : null;
  const minStayNights = isKurzzeitpflege ? (capacity?.minStayNights ?? null) : null;
  const belowMinStay = minStayNights !== null && nights !== null && nights < minStayNights;

  const pflegegradAntragLabel =
    pflegegrad === null || pflegegrad === 0
      ? "Pflegegrad bereits beantragt"
      : "Erhöhung des Pflegegrades beantragt";
  const hoursPerDayNumber = Math.max(1, Number(hoursPerDay) || 1);

  const cancellationDaysLabel =
    facility?.cancellationPolicyDays !== undefined && facility?.cancellationPolicyDays !== null
      ? `${facility.cancellationPolicyDays} ${facility.cancellationPolicyDays === 1 ? "Tag" : "Tage"}`
      : "48 Std.";

  if (facilityQuery.isLoading || profileQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  if (!facility) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6 dark:bg-brand-background-dark">
        <Text className="text-center text-base text-brand-text dark:text-brand-text-dark">
          Diese Einrichtung wurde nicht gefunden.
        </Text>
      </View>
    );
  }

  if (createBooking.isSuccess) {
    const { booking, stripeClientSecret } = createBooking.data;

    if (stripeClientSecret && !paymentConfirmed) {
      return (
        <ScrollView className="flex-1 bg-brand-background dark:bg-brand-background-dark" contentContainerClassName="gap-4 p-6">
          <Text className="text-lg font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
            Dein Platz ist reserviert - jetzt bezahlen
          </Text>
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Der Platz ist für dich vorgemerkt. Schließe die Zahlung ab, um die Buchung
            verbindlich zu machen.
          </Text>
          <StripePaymentStep clientSecret={stripeClientSecret} onConfirmed={() => setPaymentConfirmed(true)} />
        </ScrollView>
      );
    }

    return (
      <ScrollView className="flex-1 bg-brand-background dark:bg-brand-background-dark" contentContainerClassName="gap-3 p-6">
        <Text className="text-lg font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          Platz gebucht!
        </Text>
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Dein Platz ist reserviert. Die Einrichtung wurde informiert und meldet sich bei
          Rückfragen direkt bei dir.
        </Text>
        {booking.paymentMethod === "RECHNUNG" && (
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Die Einrichtung prüft die Buchung und gibt die Rechnungsstellung frei - du hörst in
            Kürze von ihr.
          </Text>
        )}
        {booking.paymentMethod === "KOSTENUEBERNAHME_KASSE" && (
          <KostenuebernahmeUpload bookingId={booking.id} />
        )}
        {booking.adminApprovalStatus === "AUSSTEHEND" && (
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Da du als bevollmächtigte/r Angehörige/r buchst, prüft unser Team diese Buchung noch
            zusätzlich - du hörst in Kürze von uns.
          </Text>
        )}
        <PrimaryButton label="Zu meinen Buchungen" onPress={() => router.replace("/(tabs)/buchungen")} />
      </ScrollView>
    );
  }

  if (capacities.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6 dark:bg-brand-background-dark">
        <Text className="text-center text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Diese Einrichtung hat aktuell keine freien Plätze.
        </Text>
      </View>
    );
  }

  function submit() {
    setClientError(null);
    if (!bookingType || pflegegrad === null) return;
    if (belowMinStay) {
      setClientError(
        `Diese Einrichtung erfordert bei Kurzzeitpflege einen Mindestaufenthalt von ${minStayNights} Nächten - der gewählte Zeitraum umfasst nur ${nights} ${nights === 1 ? "Nacht" : "Nächte"}.`,
      );
      return;
    }
    if (!guestFirstName.trim() || !guestLastName.trim() || !guestBirthDate) {
      setClientError("Bitte fülle Vorname, Nachname und Geburtsdatum aus.");
      return;
    }
    if (!guestStreet.trim() || !guestPostalCode.trim() || !guestCity.trim()) {
      setClientError("Bitte fülle die Adresse vollständig aus.");
      return;
    }
    if (!krankenkasse.trim() || !versicherungsnummer.trim()) {
      setClientError("Bitte gib Krankenkasse und Versicherungsnummer an.");
      return;
    }

    createBooking.mutate({
      // submit() is only reachable from the form below, which only renders
      // past the `!facility` early return above - TS just can't see that
      // across the closure.
      facilityId: facility!.id,
      bookingType,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: !endeOffen && endDate ? new Date(endDate).toISOString() : undefined,
      desiredStartDate: desiredStartDate ? new Date(desiredStartDate).toISOString() : undefined,
      guestFirstName: guestFirstName.trim(),
      guestLastName: guestLastName.trim(),
      guestBirthDate: guestBirthDate.toISOString(),
      guestStreet: guestStreet.trim(),
      guestPostalCode: guestPostalCode.trim(),
      guestCity: guestCity.trim(),
      krankenkasse: krankenkasse.trim(),
      versicherungsnummer: versicherungsnummer.trim(),
      pflegegrad,
      pflegegradAntragLaeuft,
      guestPhone: guestPhone.trim() || undefined,
      note: note.trim() || undefined,
      paymentMethod,
      hoursPerDay: isTagesNachtpflege ? hoursPerDayNumber : undefined,
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: "Pflegeplatz buchen" }} />
      <ScrollView className="flex-1 bg-brand-background dark:bg-brand-background-dark" contentContainerClassName="gap-4 p-6">
        <View>
          <Text className="text-xl font-bold text-brand-primary-dark dark:text-brand-heading-dark">
            Pflegeplatz buchen
          </Text>
          <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            bei {facility.name}, {facility.street}, {facility.postalCode} {facility.city}
          </Text>
        </View>

        <View className="gap-1">
          <SelectField
            label="Pflegeart"
            value={bookingType}
            options={capacities.map((c) => ({ value: c.bookingType, label: bookingTypeLabels[c.bookingType] }))}
            onChange={setBookingType}
          />
          {capacity?.monthlyPriceCents != null && (
            <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
              {formatPriceEuro(capacity.monthlyPriceCents)}/Monat (Heimpreis vor
              Pflegekassen-Zuschuss)
            </Text>
          )}
        </View>

        {isStationaer && (
          <DateField
            label="Gewünschtes Aufnahmedatum (optional)"
            value={desiredStartDate}
            onChange={setDesiredStartDate}
          />
        )}

        {isDateRanged && (
          <View className="gap-2">
            <View className="flex-row gap-6">
              <View className="flex-1">
                <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                  Von
                </Text>
                <Text className="text-base text-brand-text dark:text-brand-text-dark">
                  {startDate ? startDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "–"}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                  Bis
                </Text>
                <Text className="text-base text-brand-text dark:text-brand-text-dark">
                  {endDate ? endDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "–"}
                </Text>
              </View>
            </View>

            <DateRangeCalendar
              startDate={startDate}
              endDate={endDate}
              onChange={(newStart, newEnd) => {
                setStartDate(newStart);
                setEndDate(newEnd);
              }}
              disabled={allowsOpenEnd && endeOffen}
            />

            {isKurzzeitpflege && minStayNights !== null && (
              <Text className={`text-xs ${belowMinStay ? "text-red-600" : "text-brand-text-muted dark:text-brand-text-muted-dark"}`}>
                Mindestaufenthalt bei dieser Einrichtung: {minStayNights}{" "}
                {minStayNights === 1 ? "Nacht" : "Nächte"}
                {nights !== null && ` (gewählter Zeitraum: ${nights} ${nights === 1 ? "Nacht" : "Nächte"})`}
              </Text>
            )}

            {allowsOpenEnd && (
              <Checkbox checked={endeOffen} onToggle={() => setEndeOffen((v) => !v)}>
                Vorerst ohne Enddatum (regelmäßig, bis auf Weiteres)
              </Checkbox>
            )}
          </View>
        )}

        {isTagesNachtpflege && (
          <FormField
            label="Stunden pro Tag"
            value={hoursPerDay}
            onChangeText={(text) => setHoursPerDay(text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
          />
        )}

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label="Vorname" value={guestFirstName} onChangeText={setGuestFirstName} />
          </View>
          <View className="flex-1">
            <FormField label="Nachname" value={guestLastName} onChangeText={setGuestLastName} />
          </View>
        </View>

        <DateField label="Geburtsdatum" value={guestBirthDate} onChange={setGuestBirthDate} />

        <FormField label="Straße & Hausnummer" value={guestStreet} onChangeText={setGuestStreet} />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              label="PLZ"
              value={guestPostalCode}
              onChangeText={setGuestPostalCode}
              keyboardType="number-pad"
            />
          </View>
          <View className="flex-1">
            <FormField label="Stadt" value={guestCity} onChangeText={setGuestCity} />
          </View>
        </View>

        <FormField
          label="Krankenkasse"
          value={krankenkasse}
          onChangeText={setKrankenkasse}
          placeholder="z. B. AOK, TK, Barmer…"
        />
        <FormField
          label="Versicherungsnummer"
          value={versicherungsnummer}
          onChangeText={setVersicherungsnummer}
          autoCapitalize="characters"
          placeholder="z. B. A123456789"
        />

        <SelectField
          label="Pflegegrad"
          value={pflegegrad}
          options={pflegegradOptions}
          onChange={setPflegegrad}
        />
        <Checkbox checked={pflegegradAntragLaeuft} onToggle={() => setPflegegradAntragLaeuft((v) => !v)}>
          {pflegegradAntragLabel}
        </Checkbox>

        <FormField
          label="Telefon (optional)"
          value={guestPhone}
          onChangeText={setGuestPhone}
          keyboardType="phone-pad"
        />
        <FormField
          label="Nachricht an die Einrichtung (optional)"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          placeholder="Gibt es etwas, das die Einrichtung vorab wissen sollte?"
        />

        {bookingType && pflegegrad !== null && rate && (
          <SubsidyHint
            bookingType={bookingType}
            pflegegrad={pflegegrad}
            rate={rate}
            days={days}
            hoursPerDay={hoursPerDayNumber}
          />
        )}

        <View className="gap-2">
          <Text className="text-sm font-medium text-brand-text dark:text-brand-text-dark">
            Zahlungsart
          </Text>
          {(Object.keys(paymentMethodLabels) as PaymentMethod[])
            .filter((method) => cardPaymentAvailable || (method !== "KARTE" && method !== "KLARNA" && method !== "PAYPAL"))
            .map((method) => (
              <Checkbox key={method} checked={paymentMethod === method} onToggle={() => setPaymentMethod(method)}>
                {paymentMethodLabels[method]}
              </Checkbox>
            ))}
          {paymentMethod === "RECHNUNG" && (
            <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
              Die Rechnung wird über die Einrichtung abgewickelt - sie muss diese Zahlungsart für
              deine Buchung erst freigeben.
            </Text>
          )}
          {paymentMethod === "KOSTENUEBERNAHME_KASSE" && (
            <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
              Zahlt deine Pflegekasse die Einrichtung direkt, lädst du im nächsten Schritt die
              Kostenübernahmebestätigung hoch - auch das muss die Einrichtung freigeben.
            </Text>
          )}
        </View>

        {profile?.isBevollmaechtigt && (
          <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
            Da du als bevollmächtigte/r Angehörige/r buchst, prüft unser Team diese Buchung
            zusätzlich, bevor sie endgültig bestätigt wird.
          </Text>
        )}

        <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          Storno: Bis {cancellationDaysLabel} vorher kannst du kostenlos stornieren.
        </Text>

        {clientError && <Text className="text-sm text-red-600">{clientError}</Text>}
        {createBooking.isError && <Text className="text-sm text-red-600">{createBooking.error.message}</Text>}

        <PrimaryButton
          label={createBooking.isPending ? "Wird gebucht…" : "Verbindlich und zahlungspflichtig buchen"}
          loading={createBooking.isPending}
          onPress={submit}
        />
      </ScrollView>
    </>
  );
}
