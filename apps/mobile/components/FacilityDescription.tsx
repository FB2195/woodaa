import { useState } from "react";
import { Pressable, Text, View } from "react-native";

const PREVIEW_LENGTH = 280;

// RN port of apps/web/components/FacilityDescription.tsx.
export function FacilityDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!description) return null;

  const needsTruncation = description.length > PREVIEW_LENGTH;
  const preview = needsTruncation
    ? `${description.slice(0, PREVIEW_LENGTH).trimEnd()}…`
    : description;

  return (
    <View className="gap-2">
      <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        Beschreibung
      </Text>
      <Text className="text-sm leading-5 text-brand-text dark:text-brand-text-dark">
        {expanded ? description : preview}
      </Text>
      {needsTruncation && (
        <Pressable onPress={() => setExpanded((v) => !v)}>
          <Text className="text-sm font-semibold text-brand-accent underline">
            {expanded ? "Weniger anzeigen" : "Weiterlesen"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
