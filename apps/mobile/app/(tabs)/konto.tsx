import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";
import { setTheme } from "@/lib/themeStore";
import { trpc } from "@/lib/trpc";

const roleLabels = {
  SUCHENDE: "Suchende:r",
  BETREIBER: "Betreiber:in",
  ADMIN: "Admin",
} as const;

const menuItems = [
  { href: "/konto/favoriten", label: "Favoriten" },
  { href: "/konto/daten", label: "Meine Daten (DSGVO)" },
] as const;

export default function AccountScreen() {
  const { user, isLoading, logout } = useAuth();
  const { colorScheme } = useColorScheme();
  // emailVerifiedAt isn't part of the AuthContext's minimal user shape (see
  // lib/AuthContext.tsx) - fetched here since only this screen needs it.
  const me = trpc.auth.me.useQuery(undefined, { enabled: !!user });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-brand-background px-6 dark:bg-brand-background-dark">
        <Text className="text-center text-base text-brand-text dark:text-brand-text-dark">
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
        <ThemeToggle colorScheme={colorScheme} />
      </View>
    );
  }

  return (
    <View className="flex-1 gap-4 bg-brand-background px-6 py-8 dark:bg-brand-background-dark">
      <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <Text className="text-lg font-semibold text-brand-primary-dark">{user.name}</Text>
        <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          {user.email}
        </Text>
        <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          {roleLabels[user.role]}
        </Text>
        {me.data && !me.data.emailVerifiedAt && (
          <Text className="mt-2 text-xs text-red-600">E-Mail-Adresse noch nicht bestätigt.</Text>
        )}
      </View>

      <View className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-surface dark:border-brand-border-dark dark:bg-brand-surface-dark">
        {menuItems.map((item, index) => (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href)}
            className={`px-4 py-3.5 ${index > 0 ? "border-t border-brand-border dark:border-brand-border-dark" : ""}`}
          >
            <Text className="text-sm font-medium text-brand-text dark:text-brand-text-dark">
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ThemeToggle colorScheme={colorScheme} />

      <PrimaryButton label="Abmelden" variant="secondary" onPress={() => logout()} />
    </View>
  );
}

function ThemeToggle({ colorScheme }: { colorScheme: "light" | "dark" | undefined }) {
  const options = [
    { value: "light" as const, label: "Hell" },
    { value: "dark" as const, label: "Dunkel" },
  ];

  return (
    <View className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <Text className="mb-2 text-sm font-medium text-brand-text dark:text-brand-text-dark">
        Erscheinungsbild
      </Text>
      <View className="flex-row gap-2">
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setTheme(option.value)}
            className={`flex-1 items-center rounded-brand-md border px-3 py-2 ${
              colorScheme === option.value
                ? "border-brand-accent bg-brand-accent"
                : "border-brand-border dark:border-brand-border-dark"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                colorScheme === option.value
                  ? "text-white"
                  : "text-brand-text dark:text-brand-text-dark"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
