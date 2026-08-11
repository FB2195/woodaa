import { Pressable, Text, View } from "react-native";

// RN port of apps/web/components/MobileBookingBar.tsx - web calls this
// "Mobile" to distinguish it from the desktop sticky sidebar, but since
// this app IS the mobile client there's no such distinction here, hence
// the plain name. Always shown (no desktop breakpoint, no cookie-banner
// coexistence logic to worry about like on web).
export function FacilityBookingBar({ onPress }: { onPress: () => void }) {
  return (
    <View className="border-t border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <Pressable onPress={onPress} className="rounded-brand-md bg-brand-accent px-6 py-3">
        <Text className="text-center font-semibold text-white">Verfügbarkeit ansehen</Text>
      </Pressable>
    </View>
  );
}
