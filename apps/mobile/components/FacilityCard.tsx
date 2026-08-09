import type { BookingType } from "@woodaa/validators";
import { Image, Pressable, Text, View } from "react-native";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { resolvePhotoUrl } from "@/lib/photoUrl";

// Structural rather than aliased straight from RouterOutputs["facility"]["list"] -
// favorite.list returns the same facility shape minus the search-only
// derived fields (distanceKm, avgRating, displayPriceCents, ...), so this
// card needs to render both without duplicating itself.
type FacilityCardData = {
  id: string;
  slug: string;
  name: string;
  city: string;
  postalCode: string;
  photos: { url: string | null }[];
  capacities: { bookingType: BookingType }[];
  distanceKm?: number | null;
  avgRating?: number | null;
  reviewCount?: number;
  displayPriceCents?: number | null;
  responseTimeBadge?: string | null;
};

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
  facility: FacilityCardData;
  onPress: () => void;
}) {
  const coverPhoto = resolvePhotoUrl(facility.photos[0]?.url);

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-brand-lg border border-brand-border bg-brand-surface dark:border-brand-border-dark dark:bg-brand-surface-dark"
    >
      {coverPhoto ? (
        <Image source={{ uri: coverPhoto }} className="h-36 w-full" resizeMode="cover" />
      ) : (
        <View className="h-36 w-full items-center justify-center bg-brand-background dark:bg-brand-background-dark">
          <Text className="text-brand-text-muted dark:text-brand-text-muted-dark">Kein Foto</Text>
        </View>
      )}

      <View className="p-4">
        <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          {facility.name}
        </Text>
        <Text className="mt-0.5 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          {facility.postalCode} {facility.city}
          {facility.distanceKm != null ? ` · ${facility.distanceKm.toFixed(1)} km` : ""}
        </Text>

        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {facility.capacities.map((capacity) => (
            <View
              key={capacity.bookingType}
              className="rounded-brand-full border border-brand-border px-2 py-0.5 dark:border-brand-border-dark"
            >
              <Text className="text-xs text-brand-text dark:text-brand-text-dark">
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
            <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
              ★ {facility.avgRating.toFixed(1)} ({facility.reviewCount})
            </Text>
          )}
        </View>

        {facility.responseTimeBadge && (
          <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
            {facility.responseTimeBadge}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
