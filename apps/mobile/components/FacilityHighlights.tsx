import { Text, View } from "react-native";
import { amenityIcon, sortByAmenityPriority } from "@/lib/amenityIcons";

// RN port of apps/web/components/FacilityHighlights.tsx.
export function FacilityHighlights({ amenities }: { amenities: string[] }) {
  const top = sortByAmenityPriority(amenities).slice(0, 4);
  if (top.length === 0) return null;

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        Highlights der Unterkunft
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {top.map((amenity) => (
          <View
            key={amenity}
            className="w-[47%] items-center gap-2 rounded-brand-lg border border-brand-border px-3 py-4 dark:border-brand-border-dark"
          >
            <Text className="text-xl text-brand-accent">{amenityIcon(amenity)}</Text>
            <Text className="text-center text-sm font-medium text-brand-text dark:text-brand-text-dark">
              {amenity}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
