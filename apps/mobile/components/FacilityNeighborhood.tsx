import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { trpc } from "@/lib/trpc";

// RN-Port von apps/web/components/FacilityNeighborhood.tsx - dort sind es
// handgezeichnete SVG-Tab-Icons, hier wie im übrigen mobile Code (siehe
// components/account/icons.tsx) simple Text-Glyphen statt einer neuen
// react-native-svg-Abhängigkeit.
const tabs = [
  { key: "shopping", label: "Einkaufen", icon: "🛍" },
  { key: "healthcare", label: "Ärzte", icon: "🏥" },
  { key: "transport", label: "Transport", icon: "🚌" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function FacilityNeighborhood({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("shopping");
  const hasLocation = latitude !== null && longitude !== null;

  const nearby = trpc.facility.nearbyPlaces.useQuery(
    { latitude: latitude ?? 0, longitude: longitude ?? 0 },
    { enabled: hasLocation },
  );

  if (!hasLocation) return null;

  const places = nearby.data?.[activeTab] ?? [];

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        Umgebung der Unterkunft
      </Text>

      <View className="flex-row gap-2">
        {tabs.map(({ key, label, icon }) => (
          <Pressable
            key={key}
            onPress={() => setActiveTab(key)}
            className={`flex-row items-center gap-1.5 rounded-brand-full border px-3 py-1.5 ${
              activeTab === key
                ? "border-brand-accent bg-brand-accent"
                : "border-brand-border bg-brand-background dark:border-brand-border-dark dark:bg-brand-background-dark"
            }`}
          >
            <Text className="text-xs">{icon}</Text>
            <Text
              className={`text-xs font-medium ${
                activeTab === key ? "text-white" : "text-brand-text dark:text-brand-text-dark"
              }`}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {nearby.isLoading ? (
        <ActivityIndicator color="#2F7D4F" />
      ) : places.length === 0 ? (
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Keine Einträge in der Nähe gefunden.
        </Text>
      ) : (
        <View className="rounded-brand-lg border border-brand-border dark:border-brand-border-dark">
          {places.map((place, i) => (
            <View
              key={`${place.name}-${i}`}
              className={`flex-row items-center justify-between px-3 py-2 ${
                i > 0 ? "border-t border-brand-border dark:border-brand-border-dark" : ""
              }`}
            >
              <Text
                className="flex-1 pr-2 text-sm text-brand-text dark:text-brand-text-dark"
                numberOfLines={1}
              >
                {place.name}
              </Text>
              <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                🚶 {place.walkMinutes} Min. ({place.distanceMeters} m)
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
