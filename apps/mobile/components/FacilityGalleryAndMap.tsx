import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { FacilityLocationMap } from "@/components/FacilityLocationMap";
import { resolvePhotoUrl } from "@/lib/photoUrl";

// RN port of apps/web/components/FacilityGalleryAndMap.tsx - the map used
// to always render below the photos, pushing the rest of the page down by
// a full map height even for visitors who only wanted photos.
export function FacilityGalleryAndMap({
  photos,
  latitude,
  longitude,
  name,
}: {
  photos: { id: string; url: string | null }[];
  latitude: number | null;
  longitude: number | null;
  name: string;
}) {
  const [view, setView] = useState<"photos" | "map">("photos");
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <View className="gap-3">
      {hasLocation && (
        <View className="flex-row gap-2 px-6">
          <Pressable
            onPress={() => setView("photos")}
            className={`rounded-brand-md border px-4 py-2 ${
              view === "photos"
                ? "border-brand-accent bg-brand-accent"
                : "border-brand-border dark:border-brand-border-dark"
            }`}
          >
            <Text
              className={
                view === "photos"
                  ? "text-sm font-semibold text-white"
                  : "text-sm font-semibold text-brand-text dark:text-brand-text-dark"
              }
            >
              Fotos
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setView("map")}
            className={`rounded-brand-md border px-4 py-2 ${
              view === "map"
                ? "border-brand-accent bg-brand-accent"
                : "border-brand-border dark:border-brand-border-dark"
            }`}
          >
            <Text
              className={
                view === "map"
                  ? "text-sm font-semibold text-white"
                  : "text-sm font-semibold text-brand-text dark:text-brand-text-dark"
              }
            >
              Karte
            </Text>
          </Pressable>
        </View>
      )}

      {view === "photos" || !hasLocation ? (
        photos.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {photos.map((photo) => {
              const uri = resolvePhotoUrl(photo.url);
              return uri ? (
                <Image key={photo.id} source={{ uri }} className="h-56 w-screen" resizeMode="cover" />
              ) : null;
            })}
          </ScrollView>
        ) : null
      ) : (
        <View className="px-6">
          <FacilityLocationMap latitude={latitude} longitude={longitude} facilityName={name} />
        </View>
      )}
    </View>
  );
}
