import { router, Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, Image, ScrollView, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { trpc } from "@/lib/trpc";

function formatPriceEuro(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function FacilityDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const facilityQuery = trpc.facility.bySlug.useQuery({ slug });

  if (facilityQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  const facility = facilityQuery.data;
  if (!facility) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6">
        <Text className="text-center text-base text-brand-text">
          Diese Einrichtung wurde nicht gefunden.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: facility.name }} />
      <ScrollView className="flex-1 bg-brand-background">
        {facility.photos.length > 0 && (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {facility.photos.map((photo) =>
              photo.url ? (
                <Image
                  key={photo.id}
                  source={{ uri: photo.url }}
                  className="h-56 w-screen"
                  resizeMode="cover"
                />
              ) : null,
            )}
          </ScrollView>
        )}

        <View className="gap-4 p-6">
          <View>
            <Text className="text-2xl font-bold text-brand-primary-dark">{facility.name}</Text>
            <Text className="mt-1 text-sm text-brand-text-muted">
              {facility.street}, {facility.postalCode} {facility.city}
            </Text>
            {facility.avgRating != null && (
              <Text className="mt-1 text-sm text-brand-text-muted">
                ★ {facility.avgRating.toFixed(1)} ({facility.reviewCount} Bewertungen)
              </Text>
            )}
          </View>

          {facility.description && (
            <Text className="text-sm leading-5 text-brand-text">{facility.description}</Text>
          )}

          <View className="gap-3">
            <Text className="text-base font-semibold text-brand-primary-dark">
              Verfügbare Plätze
            </Text>
            {facility.capacities
              .filter((capacity) => capacity.totalSlots > 0)
              .map((capacity) => (
                <View
                  key={capacity.bookingType}
                  className="rounded-brand-lg border border-brand-border bg-brand-surface p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-brand-text">
                      {bookingTypeLabels[capacity.bookingType]}
                    </Text>
                    <Text
                      className={
                        capacity.availableSlots > 0
                          ? "text-sm font-medium text-brand-accent"
                          : "text-sm font-medium text-brand-text-muted"
                      }
                    >
                      {capacity.availableSlots > 0 ? `${capacity.availableSlots} frei` : "belegt"}
                    </Text>
                  </View>
                  {capacity.monthlyPriceCents != null && (
                    <Text className="mt-1 text-sm text-brand-text-muted">
                      ab {formatPriceEuro(capacity.monthlyPriceCents)} / Monat
                    </Text>
                  )}
                </View>
              ))}
          </View>

          {facility.amenities.length > 0 && (
            <View className="gap-2">
              <Text className="text-base font-semibold text-brand-primary-dark">Ausstattung</Text>
              <View className="flex-row flex-wrap gap-2">
                {facility.amenities.map((amenity) => (
                  <View
                    key={amenity}
                    className="rounded-brand-full border border-brand-border px-3 py-1"
                  >
                    <Text className="text-xs text-brand-text">{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <PrimaryButton
            label="Jetzt anfragen"
            onPress={() => {
              if (!user) {
                router.push("/login");
                return;
              }
              Alert.alert(
                "In Kürze verfügbar",
                "Der Buchungsablauf folgt in einem der nächsten Schritte.",
              );
            }}
          />
        </View>
      </ScrollView>
    </>
  );
}
