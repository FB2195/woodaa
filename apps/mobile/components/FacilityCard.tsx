import { Image, Pressable, Text, View } from "react-native";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import type { RouterOutputs } from "@/lib/trpc";

type FacilityListItem = RouterOutputs["facility"]["list"]["results"][number];

function formatPriceEuro(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function FacilityCard({
  facility,
  onPress,
}: {
  facility: FacilityListItem;
  onPress: () => void;
}) {
  const coverPhoto = facility.photos[0]?.url ?? null;

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-brand-lg border border-brand-border bg-brand-surface"
    >
      {coverPhoto ? (
        <Image source={{ uri: coverPhoto }} className="h-36 w-full" resizeMode="cover" />
      ) : (
        <View className="h-36 w-full items-center justify-center bg-brand-background">
          <Text className="text-brand-text-muted">Kein Foto</Text>
        </View>
      )}

      <View className="p-4">
        <Text className="text-base font-semibold text-brand-primary-dark">{facility.name}</Text>
        <Text className="mt-0.5 text-sm text-brand-text-muted">
          {facility.postalCode} {facility.city}
          {facility.distanceKm != null ? ` · ${facility.distanceKm.toFixed(1)} km` : ""}
        </Text>

        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {facility.capacities.map((capacity) => (
            <View
              key={capacity.bookingType}
              className="rounded-brand-full border border-brand-border px-2 py-0.5"
            >
              <Text className="text-xs text-brand-text">
                {bookingTypeLabels[capacity.bookingType]}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-brand-accent">
            {facility.displayPriceCents != null
              ? `ab ${formatPriceEuro(facility.displayPriceCents)} / Monat`
              : "Preis auf Anfrage"}
          </Text>
          {facility.avgRating != null && (
            <Text className="text-xs text-brand-text-muted">
              ★ {facility.avgRating.toFixed(1)} ({facility.reviewCount})
            </Text>
          )}
        </View>

        {facility.responseTimeBadge && (
          <Text className="mt-1 text-xs text-brand-text-muted">{facility.responseTimeBadge}</Text>
        )}
      </View>
    </Pressable>
  );
}
