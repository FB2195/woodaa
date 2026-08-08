import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Share, Text, View } from "react-native";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";
import { trpc } from "@/lib/trpc";

export default function MeineDatenScreen() {
  const { logout } = useAuth();
  const utils = trpc.useUtils();
  const deleteAccount = trpc.account.deleteAccount.useMutation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const data = await utils.client.account.exportData.query();
      await Share.share({
        title: "woodaa - Meine Daten",
        message: JSON.stringify(data, null, 2),
      });
    } catch (err) {
      Alert.alert("Fehler", err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    } finally {
      setExporting(false);
    }
  }

  function confirmDelete() {
    setError(null);
    if (!password.trim()) {
      setError("Bitte gib dein Passwort ein.");
      return;
    }
    Alert.alert("Konto wirklich löschen?", "Diese Aktion kann nicht rückgängig gemacht werden.", [
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
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-brand-background" contentContainerClassName="gap-6 p-6">
      <View className="gap-2 rounded-brand-lg border border-brand-border bg-brand-surface p-4">
        <Text className="text-base font-semibold text-brand-primary-dark">
          Meine Daten exportieren
        </Text>
        <Text className="text-sm text-brand-text-muted">
          Lädt alle über dich gespeicherten Daten (Art. 15/20 DSGVO) und öffnet das Teilen-Menü, z.
          B. um sie per E-Mail an dich selbst zu schicken.
        </Text>
        <PrimaryButton
          label="Daten exportieren"
          variant="secondary"
          loading={exporting}
          onPress={handleExport}
        />
      </View>

      <View className="gap-2 rounded-brand-lg border border-red-200 bg-brand-surface p-4">
        <Text className="text-base font-semibold text-red-600">Konto löschen</Text>
        <Text className="text-sm text-brand-text-muted">
          Löscht dein Konto und alle zugehörigen Daten unwiderruflich.
        </Text>
        <FormField
          label="Passwort zur Bestätigung"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error && <Text className="text-sm text-red-600">{error}</Text>}
        <PrimaryButton
          label="Konto endgültig löschen"
          loading={deleteAccount.isPending}
          onPress={confirmDelete}
        />
      </View>
    </ScrollView>
  );
}
