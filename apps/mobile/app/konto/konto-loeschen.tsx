import { router, Stack } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/app/konto/konto-loeschen +
// components/account/DeleteAccountForm.tsx.
export default function KontoLoeschenScreen() {
  const { logout } = useAuth();
  const deleteAccount = trpc.account.deleteAccount.useMutation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    setError(null);
    if (!password.trim()) {
      setError("Bitte gib dein Passwort ein.");
      return;
    }
    Alert.alert(
      "Konto wirklich löschen?",
      "Das kann nicht rückgängig gemacht werden. Alle deine Daten werden endgültig gelöscht.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Endgültig löschen",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount.mutateAsync({ password });
              await logout();
              router.replace("/(tabs)");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-3 p-6"
    >
      <Stack.Screen options={{ title: "Konto löschen" }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Löscht dein Konto und alle zugehörigen Daten endgültig.
      </Text>
      <View className="gap-3 rounded-brand-lg border border-red-200 bg-brand-surface p-4 dark:border-red-900 dark:bg-brand-surface-dark">
        <Text className="text-sm font-semibold text-red-700 dark:text-red-400">
          Das kann nicht rückgängig gemacht werden. Alle deine Daten werden endgültig gelöscht.
        </Text>
        <FormField
          label="Passwort zur Bestätigung"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error && <Text className="text-sm text-red-600">{error}</Text>}
        <PrimaryButton
          label={deleteAccount.isPending ? "Wird gelöscht…" : "Endgültig löschen"}
          loading={deleteAccount.isPending}
          onPress={confirmDelete}
        />
      </View>
    </ScrollView>
  );
}
