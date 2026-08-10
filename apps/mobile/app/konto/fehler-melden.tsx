import { Stack } from "expo-router";
import { ScrollView, Text } from "react-native";
import { SupportRequestForm } from "@/components/support/SupportRequestForm";

// Mobile port of apps/web/app/fehler-melden/page.tsx.
export default function FehlerMeldenScreen() {
  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 p-6"
    >
      <Stack.Screen options={{ title: "Fehler/Problem melden" }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Etwas funktioniert nicht wie erwartet? Beschreib kurz, was passiert ist - je genauer, desto
        schneller können wir helfen (z. B. was du gemacht hast und was du erwartet hättest).
      </Text>
      <SupportRequestForm type="FEHLERMELDUNG" submitLabel="Problem melden" />
    </ScrollView>
  );
}
