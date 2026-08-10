import { Stack } from "expo-router";
import { Text, View } from "react-native";

// Platzhalter: Push-/In-App-Benachrichtigungen (Buchungsstatus, neue
// freie Plätze für gespeicherte Suchen, ...) gibt es serverseitig noch
// nicht - Einstiegspunkt schon mal da (Glocke im Header der
// Suche/Startseite, siehe (tabs)/_layout.tsx).
export default function BenachrichtigungenScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-brand-background px-6 dark:bg-brand-background-dark">
      <Stack.Screen options={{ title: "Benachrichtigungen", presentation: "modal" }} />
      <Text className="text-center text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        Benachrichtigungen kommen bald
      </Text>
      <Text className="text-center text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Hier siehst du bald Updates zu deinen Buchungen und neue freie Plätze für deine
        gespeicherten Suchen.
      </Text>
    </View>
  );
}
