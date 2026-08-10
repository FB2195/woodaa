import { Stack } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Share, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/app/konto/meine-daten +
// components/account/ExportDataButton.tsx. "Konto löschen" is its own
// screen now (konto-loeschen.tsx), matching the web menu's separation.
export default function MeineDatenScreen() {
  const utils = trpc.useUtils();
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

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-6 p-6"
    >
      <Stack.Screen options={{ title: "Meine Daten exportieren" }} />
      <View className="gap-2 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
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
    </ScrollView>
  );
}
