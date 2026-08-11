import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { KostenuebernahmeUpload } from "@/components/booking/KostenuebernahmeUpload";
import { PrimaryButton } from "@/components/PrimaryButton";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { facilityApprovalLabels, paymentStatusLabels } from "@/lib/bookingStatusLabels";
import { formatDate } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/paymentMethodLabels";
import { pflegegradLabels } from "@/lib/pflegegradLabels";
import { resolvePhotoUrl } from "@/lib/photoUrl";
import { trpc } from "@/lib/trpc";

const toneClasses = {
  amber: "bg-amber-100 text-amber-700",
  accent: "bg-brand-accent/10 text-brand-accent",
  red: "bg-red-100 text-red-700",
} as const;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4 border-b border-brand-border py-2.5 dark:border-brand-border-dark">
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">{label}</Text>
      <Text className="flex-1 text-right text-sm text-brand-text dark:text-brand-text-dark">
        {value}
      </Text>
    </View>
  );
}

// Reuses the already-cached booking.myBookings list (same query as the
// (tabs)/buchungen.tsx list this is pushed from) and filters client-side by
// id - no dedicated "single booking" endpoint needed, matches
// apps/web/app/konto/buchungen/[id]/page.tsx's approach.
export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.booking.myBookings.useQuery();
  const booking = data?.find((b) => b.id === id);

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancel = trpc.booking.myCancel.useMutation();

  // Title is static (doesn't depend on loaded data), so render it
  // unconditionally on every branch below - otherwise the header briefly
  // shows the raw route path while the query is loading.
  const screenTitle = <Stack.Screen options={{ title: "Buchung" }} />;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        {screenTitle}
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6 dark:bg-brand-background-dark">
        {screenTitle}
        <Text className="text-center text-base text-brand-text dark:text-brand-text-dark">
          Diese Buchung wurde nicht gefunden.
        </Text>
      </View>
    );
  }

  const isCancelled = booking.status === "STORNIERT";
  const approval =
    booking.facilityApprovalStatus !== "NICHT_ERFORDERLICH"
      ? facilityApprovalLabels[booking.facilityApprovalStatus]
      : null;
  const coverPhoto = resolvePhotoUrl(booking.facility.photos[0]?.url);
  const guestName =
    booking.guestFirstName && `${booking.guestFirstName} ${booking.guestLastName ?? ""}`.trim();

  async function handleCancel() {
    setError(null);
    try {
      await cancel.mutateAsync({ bookingId: booking!.id });
      await utils.booking.myBookings.invalidate();
      setConfirmingCancel(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <>
      {screenTitle}
      <ScrollView className="flex-1 bg-brand-background dark:bg-brand-background-dark">
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto }} className="h-48 w-full" resizeMode="cover" />
        ) : (
          <View className="h-48 w-full items-center justify-center bg-brand-surface dark:bg-brand-surface-dark">
            <Text className="text-4xl">🏡</Text>
          </View>
        )}

        <View className="gap-4 p-6">
          <View className="flex-row flex-wrap items-start justify-between gap-2">
            <View className="flex-1">
              <Text
                onPress={() => router.push(`/einrichtung/${booking.facility.slug}`)}
                className="text-xl font-bold text-brand-primary-dark dark:text-brand-heading-dark"
              >
                {booking.facility.name}
              </Text>
              <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                {booking.facility.street}, {booking.facility.postalCode} {booking.facility.city}
              </Text>
            </View>
            {isCancelled ? (
              <View className="rounded-brand-full bg-brand-border px-3 py-1 dark:bg-brand-border-dark">
                <Text className="text-xs font-medium text-brand-text-muted dark:text-brand-text-muted-dark">
                  Storniert
                </Text>
              </View>
            ) : (
              approval && (
                <View className={`rounded-brand-full px-3 py-1 ${toneClasses[approval.tone]}`}>
                  <Text className="text-xs font-medium">{approval.text}</Text>
                </View>
              )
            )}
          </View>

          <PrimaryButton
            label="Zur Einrichtung"
            variant="secondary"
            onPress={() => router.push(`/einrichtung/${booking.facility.slug}`)}
          />

          <View>
            <DetailRow label="Pflegeart" value={bookingTypeLabels[booking.bookingType]} />
            {booking.startDate && (
              <DetailRow
                label="Zeitraum"
                value={
                  booking.endDate
                    ? `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`
                    : booking.bookingType !== "STATIONAERE_AUFNAHME"
                      ? `ab ${formatDate(booking.startDate)} (ohne Enddatum)`
                      : formatDate(booking.startDate)
                }
              />
            )}
            {booking.desiredStartDate && (
              <DetailRow label="Gewünschter Einzug" value={formatDate(booking.desiredStartDate)} />
            )}
            {booking.hoursPerDay != null && (
              <DetailRow label="Stunden pro Tag" value={String(booking.hoursPerDay)} />
            )}
            {guestName && <DetailRow label="Für" value={guestName} />}
            {booking.pflegegrad !== null && (
              <DetailRow
                label="Pflegegrad"
                value={pflegegradLabels[booking.pflegegrad as 0 | 1 | 2 | 3 | 4 | 5]}
              />
            )}
            {booking.krankenkasse && <DetailRow label="Krankenkasse" value={booking.krankenkasse} />}
            {booking.paymentMethod && (
              <DetailRow label="Zahlungsart" value={paymentMethodLabels[booking.paymentMethod]} />
            )}
            {booking.paymentStatus && (
              <DetailRow
                label="Zahlungsstatus"
                value={paymentStatusLabels[booking.paymentStatus] ?? booking.paymentStatus}
              />
            )}
            <DetailRow label="Gebucht am" value={formatDate(booking.createdAt)} />
            {booking.cancelledAt && (
              <DetailRow label="Storniert am" value={formatDate(booking.cancelledAt)} />
            )}
          </View>

          {booking.note && (
            <View>
              <Text className="text-sm font-medium text-brand-text dark:text-brand-text-dark">
                Nachricht an die Einrichtung
              </Text>
              <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                {booking.note}
              </Text>
            </View>
          )}

          {!isCancelled && booking.paymentMethod === "KOSTENUEBERNAHME_KASSE" && (
            <KostenuebernahmeUpload bookingId={booking.id} />
          )}

          {!isCancelled && (
            <View className="border-t border-brand-border pt-4 dark:border-brand-border-dark">
              {confirmingCancel ? (
                <View className="flex-row gap-2">
                  <PrimaryButton
                    label={cancel.isPending ? "Storniere…" : "Wirklich stornieren"}
                    loading={cancel.isPending}
                    onPress={handleCancel}
                  />
                  <PrimaryButton
                    label="Zurück"
                    variant="secondary"
                    onPress={() => setConfirmingCancel(false)}
                  />
                </View>
              ) : (
                <PrimaryButton
                  label="Buchung stornieren"
                  variant="secondary"
                  onPress={() => setConfirmingCancel(true)}
                />
              )}
              {error && <Text className="mt-2 text-sm text-red-600">{error}</Text>}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
