import { router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";

export default function BookingsScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-brand-background px-6">
        <Text className="text-center text-base text-brand-text">
          Melde dich an, um deine Buchungen zu sehen.
        </Text>
        <PrimaryButton label="Anmelden" onPress={() => router.push("/login")} />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-brand-background px-6">
      <Text className="text-center text-base text-brand-text-muted">
        Deine Buchungen erscheinen hier in Kürze.
      </Text>
    </View>
  );
}
