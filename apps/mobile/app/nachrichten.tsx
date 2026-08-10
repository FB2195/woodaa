import { Stack } from "expo-router";
import { Text, View } from "react-native";

// Platzhalter: Chat zwischen Suchenden und Einrichtungen (künftig auch
// Krankenkassen) gibt es serverseitig noch nicht - Einstiegspunkt schon
// mal da (Sprechblase im Header der Suche/Startseite, siehe
// (tabs)/_layout.tsx), damit der Header fertig aussieht und das Feature
// später einfach eingehängt werden kann.
export default function NachrichtenScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-brand-background px-6 dark:bg-brand-background-dark">
      <Stack.Screen options={{ title: "Nachrichten", presentation: "modal" }} />
      <Text className="text-center text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        Nachrichten kommen bald
      </Text>
      <Text className="text-center text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Hier wirst du bald direkt mit Pflegeeinrichtungen (und später Krankenkassen) schreiben
        können.
      </Text>
    </View>
  );
}
