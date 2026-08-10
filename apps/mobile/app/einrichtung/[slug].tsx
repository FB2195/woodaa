import { router, Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { FacilityLocationMap } from "@/components/FacilityLocationMap";
import { FacilityNeighborhood } from "@/components/FacilityNeighborhood";
import { FacilityReviews } from "@/components/FacilityReviews";
import { FavoriteButton } from "@/components/FavoriteButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PflegekassenZuschussRechner } from "@/components/PflegekassenZuschussRechner";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatPriceEuro } from "@/lib/format";
import { resolvePhotoUrl } from "@/lib/photoUrl";
import { trpc } from "@/lib/trpc";

export default function FacilityDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const facilityQuery = trpc.facility.bySlug.useQuery({ slug });

  if (facilityQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  const facility = facilityQuery.data;
  if (!facility) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6 dark:bg-brand-background-dark">
        <Text className="text-center text-base text-brand-text dark:text-brand-text-dark">
          Diese Einrichtung wurde nicht gefunden.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: facility.name }} />
      <ScrollView className="flex-1 bg-brand-background dark:bg-brand-background-dark">
        {facility.photos.length > 0 && (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {facility.photos.map((photo) => {
              const uri = resolvePhotoUrl(photo.url);
              return uri ? (
                <Image key={photo.id} source={{ uri }} className="h-56 w-screen" resizeMode="cover" />
              ) : null;
            })}
          </ScrollView>
        )}

        <View className="gap-4 p-6">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-brand-primary-dark dark:text-brand-heading-dark">
                  {facility.name}
                </Text>
                {facility.verifiedAt && <VerifiedBadge />}
              </View>
              <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                {facility.street}, {facility.postalCode} {facility.city}
              </Text>
              {facility.avgRating != null && (
                <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                  ★ {facility.avgRating.toFixed(1)} ({facility.reviewCount} Bewertungen)
                </Text>
              )}
            </View>
            <FavoriteButton facilityId={facility.id} />
          </View>

          <FacilityLocationMap
            latitude={facility.latitude}
            longitude={facility.longitude}
            facilityName={facility.name}
          />

          {facility.description && (
            <Text className="text-sm leading-5 text-brand-text dark:text-brand-text-dark">
              {facility.description}
            </Text>
          )}

          <View className="gap-3">
            <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
              Verfügbare Plätze
            </Text>
            {facility.capacities
              .filter((capacity) => capacity.totalSlots > 0)
              .map((capacity) => (
                <View
                  key={capacity.bookingType}
                  className="rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-brand-text dark:text-brand-text-dark">
                      {bookingTypeLabels[capacity.bookingType]}
                    </Text>
                    <Text
                      className={
                        capacity.availableSlots > 0
                          ? "text-sm font-medium text-brand-accent"
                          : "text-sm font-medium text-brand-text-muted dark:text-brand-text-muted-dark"
                      }
                    >
                      {capacity.availableSlots > 0 ? `${capacity.availableSlots} frei` : "belegt"}
                    </Text>
                  </View>
                  {capacity.monthlyPriceCents != null && (
                    <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                      ab {formatPriceEuro(capacity.monthlyPriceCents)} / Monat (Heimpreis vor
                      Pflegekassen-Zuschuss)
                    </Text>
                  )}
                  {capacity.pflegegradPricing.length > 0 && (
                    <PflegekassenZuschussRechner
                      bookingType={capacity.bookingType}
                      pflegegradPricing={capacity.pflegegradPricing}
                    />
                  )}
                </View>
              ))}
          </View>

          {facility.amenities.length > 0 && (
            <View className="gap-2">
              <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
                Ausstattung
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {facility.amenities.map((amenity) => (
                  <View
                    key={amenity}
                    className="rounded-brand-full border border-brand-border px-3 py-1 dark:border-brand-border-dark"
                  >
                    <Text className="text-xs text-brand-text dark:text-brand-text-dark">
                      {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(facility.checkInTime ||
            facility.checkOutTime ||
            facility.visitingHours ||
            facility.wifiInfo ||
            facility.parkingInfo ||
            facility.petsPolicy ||
            facility.cancellationPolicyDays !== null) && (
            <View className="gap-2">
              <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
                Unterkunftsrichtlinien
              </Text>
              <View className="flex-row flex-wrap gap-x-6 gap-y-3">
                {facility.checkInTime && (
                  <View className="min-w-[45%]">
                    <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                      Check-in
                    </Text>
                    <Text className="text-sm text-brand-text dark:text-brand-text-dark">
                      {facility.checkInTime}
                    </Text>
                  </View>
                )}
                {facility.checkOutTime && (
                  <View className="min-w-[45%]">
                    <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                      Check-out
                    </Text>
                    <Text className="text-sm text-brand-text dark:text-brand-text-dark">
                      {facility.checkOutTime}
                    </Text>
                  </View>
                )}
                {facility.visitingHours && (
                  <View className="min-w-[45%]">
                    <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                      Besuchszeiten
                    </Text>
                    <Text className="text-sm text-brand-text dark:text-brand-text-dark">
                      {facility.visitingHours}
                    </Text>
                  </View>
                )}
                {facility.wifiInfo && (
                  <View className="min-w-[45%]">
                    <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                      Internetzugang
                    </Text>
                    <Text className="text-sm text-brand-text dark:text-brand-text-dark">
                      {facility.wifiInfo}
                    </Text>
                  </View>
                )}
                {facility.parkingInfo && (
                  <View className="min-w-[45%]">
                    <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                      Parkmöglichkeiten
                    </Text>
                    <Text className="text-sm text-brand-text dark:text-brand-text-dark">
                      {facility.parkingInfo}
                    </Text>
                  </View>
                )}
                {facility.petsPolicy && (
                  <View className="min-w-[45%]">
                    <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                      Haustiere
                    </Text>
                    <Text className="text-sm text-brand-text dark:text-brand-text-dark">
                      {facility.petsPolicy}
                    </Text>
                  </View>
                )}
                {facility.cancellationPolicyDays !== null && (
                  <View className="min-w-[45%]">
                    <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                      Stornierung
                    </Text>
                    <Text className="text-sm text-brand-text dark:text-brand-text-dark">
                      Bis {facility.cancellationPolicyDays}{" "}
                      {facility.cancellationPolicyDays === 1 ? "Tag" : "Tage"} vorher kostenlos
                      stornierbar
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <FacilityNeighborhood latitude={facility.latitude} longitude={facility.longitude} />

          <PrimaryButton
            label="Pflegeplatz buchen"
            onPress={() => {
              if (!user) {
                router.push("/login");
                return;
              }
              router.push(`/einrichtung/${facility.slug}/buchen`);
            }}
          />

          <FacilityReviews
            facilitySlug={facility.slug}
            facilityName={facility.name}
            reviews={facility.reviews}
            avgRating={facility.avgRating}
            reviewCount={facility.reviewCount}
          />
        </View>
      </ScrollView>
    </>
  );
}
