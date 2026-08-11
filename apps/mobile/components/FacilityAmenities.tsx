import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { amenityIcon, sortByAmenityPriority } from "@/lib/amenityIcons";

const COLLAPSED_COUNT = 6;

// RN port of apps/web/components/FacilityAmenities.tsx.
export function FacilityAmenities({ amenities }: { amenities: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = sortByAmenityPriority(amenities);
  if (sorted.length === 0) return null;

  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        Beliebteste Ausstattungen
      </Text>
      <View className="gap-2.5">
        {visible.map((amenity) => (
          <View key={amenity} className="flex-row items-center gap-3">
            <Text className="text-base text-brand-text-muted dark:text-brand-text-muted-dark">
              {amenityIcon(amenity)}
            </Text>
            <Text className="text-sm text-brand-text dark:text-brand-text-dark">{amenity}</Text>
          </View>
        ))}
      </View>

      {sorted.length > COLLAPSED_COUNT && (
        <Pressable onPress={() => setExpanded((v) => !v)}>
          <Text className="text-sm font-semibold text-brand-accent underline">
            {expanded ? "Weniger anzeigen" : "Alle Ausstattungsmerkmale anzeigen"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
