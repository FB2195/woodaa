import { router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";
import { trpc } from "@/lib/trpc";

const roleLabels = {
  SUCHENDE: "Suchende:r",
  BETREIBER: "Betreiber:in",
  ADMIN: "Admin",
} as const;

export default function AccountScreen() {
  const { user, isLoading, logout } = useAuth();
  // emailVerifiedAt isn't part of the AuthContext's minimal user shape (see
  // lib/AuthContext.tsx) - fetched here since only this screen needs it.
  const me = trpc.auth.me.useQuery(undefined, { enabled: !!user });

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
          Melde dich an oder erstelle ein Konto, um woodaa vollständig zu nutzen.
        </Text>
        <View className="w-full gap-3">
          <PrimaryButton label="Anmelden" onPress={() => router.push("/login")} />
          <PrimaryButton
            label="Konto erstellen"
            variant="secondary"
            onPress={() => router.push("/registrieren")}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-4 bg-brand-background px-6 py-8">
      <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-4">
        <Text className="text-lg font-semibold text-brand-primary-dark">{user.name}</Text>
        <Text className="mt-1 text-sm text-brand-text-muted">{user.email}</Text>
        <Text className="mt-1 text-xs text-brand-text-muted">{roleLabels[user.role]}</Text>
        {me.data && !me.data.emailVerifiedAt && (
          <Text className="mt-2 text-xs text-red-600">E-Mail-Adresse noch nicht bestätigt.</Text>
        )}
      </View>

      <PrimaryButton label="Abmelden" variant="secondary" onPress={() => logout()} />
    </View>
  );
}
