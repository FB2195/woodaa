import { Text, View } from "react-native";

// RN port of apps/web/components/VerifiedBadge.tsx - see that file for the
// meaning of this badge.
export function VerifiedBadge() {
  return (
    <View className="flex-row items-center gap-1 self-start rounded-brand-full bg-brand-accent/10 px-2.5 py-1">
      <Text className="text-xs font-medium text-brand-accent">✓ Verifiziert</Text>
    </View>
  );
}
