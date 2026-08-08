import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { facilityApprovalLabels, paymentStatusLabels } from "@/lib/bookingStatusLabels";
import { formatDate } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/paymentMethodLabels";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc";

type MyBooking = RouterOutputs["booking"]["myBookings"][number];

const toneClasses = {
  amber: "bg-amber-100 text-amber-700",
  accent: "bg-brand-accent/10 text-brand-accent",
  red: "bg-red-100 text-red-700",
} as const;

function BookingCard({ booking }: { booking: MyBooking }) {
  const utils = trpc.useUtils();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancel = trpc.booking.myCancel.useMutation();

  const isCancelled = booking.status === "STORNIERT";
  const approval =
    booking.facilityApprovalStatus !== "NICHT_ERFORDERLICH"
      ? facilityApprovalLabels[booking.facilityApprovalStatus]
      : null;

  async function handleCancel() {
    setError(null);
    try {
      await cancel.mutateAsync({ bookingId: booking.id });
      await utils.booking.myBookings.invalidate();
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <View className="mb-4 rounded-brand-lg border border-brand-border bg-brand-surface p-4">
      <Pressable onPress={() => router.push(`/einrichtung/${booking.facility.slug}`)}>
        <Text className="text-base font-semibold text-brand-primary-dark">
          {booking.facility.name}
        </Text>
      </Pressable>
      <Text className="mt-0.5 text-sm text-brand-text-muted">
        {booking.facility.street}, {booking.facility.postalCode} {booking.facility.city}
      </Text>
      <Text className="mt-1 text-sm text-brand-text-muted">
        {bookingTypeLabels[booking.bookingType]}
        {booking.guestFirstName
          ? ` · ${booking.guestFirstName} ${booking.guestLastName ?? ""}`.trimEnd()
          : ""}
      </Text>
      {booking.startDate && (
        <Text className="text-sm text-brand-text-muted">
          {formatDate(booking.startDate)}
          {booking.endDate
            ? ` bis ${formatDate(booking.endDate)}`
            : booking.bookingType !== "STATIONAERE_AUFNAHME"
              ? " (ohne Enddatum)"
              : ""}
        </Text>
      )}
      {booking.desiredStartDate && (
        <Text className="text-sm text-brand-text-muted">
          Gewünschter Einzug: {formatDate(booking.desiredStartDate)}
        </Text>
      )}
      {booking.paymentMethod && (
        <Text className="text-sm text-brand-text-muted">
          {paymentMethodLabels[booking.paymentMethod]}
          {booking.paymentStatus
            ? ` · ${paymentStatusLabels[booking.paymentStatus] ?? booking.paymentStatus}`
            : ""}
        </Text>
      )}

      <View className="mt-3 flex-row items-center justify-between">
        {isCancelled ? (
          <View className="rounded-brand-full bg-brand-border px-2 py-0.5">
            <Text className="text-xs font-medium text-brand-text-muted">Storniert</Text>
          </View>
        ) : approval ? (
          <View className={`rounded-brand-full px-2 py-0.5 ${toneClasses[approval.tone]}`}>
            <Text className="text-xs font-medium">{approval.text}</Text>
          </View>
        ) : (
          <View />
        )}

        {!isCancelled &&
          (confirming ? (
            <View className="flex-row gap-2">
              <Pressable
                disabled={cancel.isPending}
                onPress={handleCancel}
                className="rounded-brand-md bg-red-600 px-3 py-1.5"
              >
                <Text className="text-xs font-semibold text-white">
                  {cancel.isPending ? "Storniere…" : "Wirklich stornieren"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setConfirming(false)}
                className="rounded-brand-md border border-brand-border px-3 py-1.5"
              >
                <Text className="text-xs font-semibold text-brand-text-muted">Zurück</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setConfirming(true)}>
              <Text className="text-xs font-semibold text-brand-text-muted">Stornieren</Text>
            </Pressable>
          ))}
      </View>

      {error && <Text className="mt-2 text-xs text-red-600">{error}</Text>}
    </View>
  );
}

export default function BookingsScreen() {
  const { user, isLoading } = useAuth();
  const bookingsQuery = trpc.booking.myBookings.useQuery(undefined, { enabled: !!user });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-brand-background px-6">
        <Text className="text-center text-base text-brand-text">
          Melde dich an, um deine Buchungen zu sehen.
        </Text>
        <PrimaryButton label="Anmelden" onPress={() => router.push("/login")} />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-brand-background"
      contentContainerClassName="p-6"
      data={bookingsQuery.data ?? []}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        bookingsQuery.isLoading ? (
          <ActivityIndicator color="#2F7D4F" />
        ) : (
          <Text className="pt-10 text-center text-sm text-brand-text-muted">
            Noch keine Buchungen vorhanden.
          </Text>
        )
      }
      renderItem={({ item }) => <BookingCard booking={item} />}
    />
  );
}
