import { router, Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { FacilityAmenities } from "@/components/FacilityAmenities";
import { FacilityAvailability } from "@/components/FacilityAvailability";
import { FacilityBookingBar } from "@/components/FacilityBookingBar";
import { FacilityBookingRequestForm } from "@/components/FacilityBookingRequestForm";
import { FacilityDescription } from "@/components/FacilityDescription";
import { FacilityGalleryAndMap } from "@/components/FacilityGalleryAndMap";
import { FacilityHighlights } from "@/components/FacilityHighlights";
import { FacilityNeighborhood } from "@/components/FacilityNeighborhood";
import { FacilityPolicyLinks } from "@/components/FacilityPolicyLinks";
import { FacilityReviews } from "@/components/FacilityReviews";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StarRating } from "@/components/StarRating";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useAuth } from "@/lib/AuthContext";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { pflegegradLabels } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";
import type { Pflegegrad } from "@woodaa/validators";

// Mirrors apps/web/app/einrichtung/[slug]/page.tsx's section order (see
// that file plus FacilityHighlights/FacilityAmenities/FacilityAvailability/
// FacilityPolicyLinks/FacilityGalleryAndMap/MobileBookingBar for the
// "Booking.com-Vorbild" redesign this ports): header info -> gallery/map
// -> highlights -> reviews -> neighborhood -> amenities -> availability ->
// description -> policy links -> operator line -> booking CTA, plus a
// sticky bottom bar that scrolls to the availability section.
export default function FacilityDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const facilityQuery = trpc.facility.bySlug.useQuery({ slug });
  const scrollViewRef = useRef<ScrollView>(null);
  const availabilityRef = useRef<View>(null);
  const [bookingMode, setBookingMode] = useState<"book" | "inquire">("book");

  function scrollToAvailability() {
    availabilityRef.current?.measureLayout(
      scrollViewRef.current?.getInnerViewNode(),
      (_x: number, y: number) => scrollViewRef.current?.scrollTo({ y, animated: true }),
    );
  }

  if (facilityQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        {/* Title depends on the loaded facility name - show a sensible
            static fallback until it's available, instead of the raw route
            path (e.g. "einrichtung/[slug]"). */}
        <Stack.Screen options={{ title: "Einrichtung" }} />
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  const facility = facilityQuery.data;
  if (!facility) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6 dark:bg-brand-background-dark">
        <Stack.Screen options={{ title: "Einrichtung" }} />
        <Text className="text-center text-base text-brand-text dark:text-brand-text-dark">
          Diese Einrichtung wurde nicht gefunden.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: facility.name }} />
      <View className="flex-1 bg-brand-background dark:bg-brand-background-dark">
        <ScrollView ref={scrollViewRef} className="flex-1">
          <View className="gap-4 p-6">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl font-bold text-brand-primary-dark dark:text-brand-heading-dark">
                    {facility.name}
                  </Text>
                  {facility.verifiedAt && <VerifiedBadge />}
                </View>
                {facility.reviewCount > 0 && (
                  <View className="mt-1.5 flex-row items-center gap-2">
                    <StarRating rating={facility.avgRating ?? 0} size="sm" />
                    <Text className="text-sm font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
                      {(facility.avgRating ?? 0).toLocaleString("de-DE", { maximumFractionDigits: 1 })}
                    </Text>
                    <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                      ({facility.reviewCount} {facility.reviewCount === 1 ? "Bewertung" : "Bewertungen"})
                    </Text>
                  </View>
                )}
                <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                  {facility.street}, {facility.postalCode} {facility.city}, {facility.state}
                </Text>
                {(facility.minPflegegrad !== null || facility.maxPflegegrad !== null) && (
                  <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                    Geeignet für{" "}
                    {facility.minPflegegrad !== null && facility.maxPflegegrad !== null
                      ? `Pflegegrad ${facility.minPflegegrad}–${facility.maxPflegegrad}`
                      : pflegegradLabels[
                          (facility.minPflegegrad ?? facility.maxPflegegrad) as Pflegegrad
                        ]}
                  </Text>
                )}
                {facility.responseTimeBadge && (
                  <Text className="mt-2 self-start rounded-brand-full border border-brand-border px-3 py-1 text-xs font-medium text-brand-text-muted dark:border-brand-border-dark dark:text-brand-text-muted-dark">
                    ⏱ {facility.responseTimeBadge}
                  </Text>
                )}
              </View>
              <FavoriteButton facilityId={facility.id} />
            </View>
          </View>

          <FacilityGalleryAndMap
            photos={facility.photos}
            latitude={facility.latitude}
            longitude={facility.longitude}
            name={facility.name}
          />

          <View className="gap-6 p-6">
            <FacilityHighlights amenities={facility.amenities} />

            <FacilityReviews
              facilitySlug={facility.slug}
              facilityName={facility.name}
              reviews={facility.reviews}
              avgRating={facility.avgRating}
              reviewCount={facility.reviewCount}
            />

            <FacilityNeighborhood latitude={facility.latitude} longitude={facility.longitude} />

            <FacilityAmenities amenities={facility.amenities} />

            <View ref={availabilityRef} collapsable={false}>
              <FacilityAvailability capacities={facility.capacities} />
            </View>

            <FacilityDescription description={facility.description ?? ""} />

            <FacilityPolicyLinks
              slug={facility.slug}
              name={facility.name}
              checkInTime={facility.checkInTime}
              checkOutTime={facility.checkOutTime}
              visitingHours={facility.visitingHours}
              wifiInfo={facility.wifiInfo}
              parkingInfo={facility.parkingInfo}
              petsPolicy={facility.petsPolicy}
              cancellationPolicyDays={facility.cancellationPolicyDays}
            />

            <Text className="border-t border-brand-border pt-4 text-sm text-brand-text-muted dark:border-brand-border-dark dark:text-brand-text-muted-dark">
              Verwaltet von {facility.operatorName}
            </Text>

            {bookingMode === "inquire" ? (
              <View className="gap-3">
                <FacilityBookingRequestForm
                  facilityId={facility.id}
                  availableBookingTypes={facility.capacities
                    .filter((c) => c.availableSlots > 0)
                    .map((c) => c.bookingType)}
                />
                <Pressable onPress={() => setBookingMode("book")}>
                  <Text className="text-center text-sm text-brand-text-muted underline dark:text-brand-text-muted-dark">
                    Doch lieber direkt verbindlich buchen
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
                <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
                  Jetzt buchen
                </Text>
                <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                  Verfügbar für{" "}
                  {facility.capacities
                    .filter((c) => c.availableSlots > 0)
                    .map((c) => bookingTypeLabels[c.bookingType])
                    .join(", ")}
                  . Deine Buchung ist sofort verbindlich – ein Platz wird direkt für dich
                  reserviert.
                </Text>
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
                <Pressable onPress={() => setBookingMode("inquire")}>
                  <Text className="text-center text-sm text-brand-text-muted underline dark:text-brand-text-muted-dark">
                    Ich möchte erst unverbindlich anfragen
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        <FacilityBookingBar onPress={scrollToAvailability} />
      </View>
    </>
  );
}
