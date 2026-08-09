import { router } from "expo-router";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { facilityApprovalLabels } from "@/lib/bookingStatusLabels";
import { formatDate } from "@/lib/format";
import { resolvePhotoUrl } from "@/lib/photoUrl";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc";

type MyBooking = RouterOutputs["booking"]["myBookings"][number];

const toneClasses = {
  amber: "bg-amber-100 text-amber-700",
  accent: "bg-brand-accent/10 text-brand-accent",
  red: "bg-red-100 text-red-700",
} as const;

function BookingCard({ booking }: { booking: MyBooking }) {
  const isCancelled = booking.status === "STORNIERT";
  const approval =
    booking.facilityApprovalStatus !== "NICHT_ERFORDERLICH"
      ? facilityApprovalLabels[booking.facilityApprovalStatus]
      : null;
  const coverPhoto = resolvePhotoUrl(booking.facility.photos[0]?.url);

  return (
    <Pressable
      onPress={() => router.push(`/buchungen/${booking.id}`)}
      className="mb-4 flex-row gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-3 dark:border-brand-border-dark dark:bg-brand-surface-dark"
    >
      {coverPhoto ? (
        <Image source={{ uri: coverPhoto }} className="h-24 w-28 rounded-brand-md" resizeMode="cover" />
      ) : (
        <View className="h-24 w-28 items-center justify-center rounded-brand-md bg-brand-background dark:bg-brand-background-dark">
          <Text className="text-2xl">🏡</Text>
        </View>
      )}

      <View className="flex-1 justify-between py-0.5">
        <View>
          <Text
            numberOfLines={1}
            className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark"
          >
            {booking.facility.name}
          </Text>
          <Text
            numberOfLines={1}
            className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark"
          >
            {booking.facility.postalCode} {booking.facility.city}
          </Text>
          <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            {bookingTypeLabels[booking.bookingType]}
            {booking.startDate
              ? ` · ${formatDate(booking.startDate)}${booking.endDate ? ` – ${formatDate(booking.endDate)}` : ""}`
              : ""}
          </Text>
        </View>

        {isCancelled ? (
          <View className="self-start rounded-brand-full bg-brand-border px-2 py-0.5 dark:bg-brand-border-dark">
            <Text className="text-xs font-medium text-brand-text-muted dark:text-brand-text-muted-dark">
              Storniert
            </Text>
          </View>
        ) : (
          approval && (
            <View className={`self-start rounded-brand-full px-2 py-0.5 ${toneClasses[approval.tone]}`}>
              <Text className="text-xs font-medium">{approval.text}</Text>
            </View>
          )
        )}
      </View>
    </Pressable>
  );
}

export default function BookingsScreen() {
  const { user, isLoading } = useAuth();
  const bookingsQuery = trpc.booking.myBookings.useQuery(undefined, { enabled: !!user });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-brand-background px-6 dark:bg-brand-background-dark">
        <Text className="text-center text-base text-brand-text dark:text-brand-text-dark">
          Melde dich an, um deine Buchungen zu sehen.
        </Text>
        <PrimaryButton label="Anmelden" onPress={() => router.push("/login")} />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="p-6"
      data={bookingsQuery.data ?? []}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        bookingsQuery.isLoading ? (
          <ActivityIndicator color="#2F7D4F" />
        ) : (
          <Text className="pt-10 text-center text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Noch keine Buchungen vorhanden.
          </Text>
        )
      }
      renderItem={({ item }) => <BookingCard booking={item} />}
    />
  );
}
