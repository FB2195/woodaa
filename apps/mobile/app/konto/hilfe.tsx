import { router, Stack } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

// Mobile port of apps/web/app/hilfe/page.tsx.
export default function HilfeScreen() {
  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 p-6"
    >
      <Stack.Screen options={{ title: "Hilfe & FAQ" }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Hier findest du Antworten auf häufige Fragen und alle Wege, uns zu erreichen.
      </Text>

      <Pressable
        onPress={() => router.push("/konto/kundenservice")}
        className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark"
      >
        <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          Kundenservice
        </Text>
        <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          FAQ, Telefon-Hotline (24/7), KI-Chat, Rückruf anfordern oder eine individuelle Nachricht
          schreiben.
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/konto/fehler-melden")}
        className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark"
      >
        <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          Fehler/Problem melden
        </Text>
        <View>
          <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Etwas funktioniert nicht wie erwartet? Sag uns kurz, was los ist.
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}
