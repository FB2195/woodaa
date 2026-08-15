import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { PflegeleistungenRechner } from "@/components/PflegeleistungenRechner";

// Mobile port of apps/web/app/pflegeleistungen-berechnen/page.tsx.
export default function PflegeleistungenBerechnenScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Pflegeleistungen berechnen" }} />
      <ScrollView
        className="flex-1 bg-brand-background dark:bg-brand-background-dark"
        contentContainerClassName="gap-4 p-6"
      >
        <View>
          <Text className="text-xl font-bold text-brand-primary-dark dark:text-brand-heading-dark">
            Pflegeleistungen berechnen
          </Text>
          <Text className="mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Wähle Pflegeart und Pflegegrad, trag die Heimkosten ein – für Kurzzeitpflege
            zusätzlich, wie viel du dieses Jahr schon genutzt hast – und sieh sofort deinen
            voraussichtlichen Eigenanteil.
          </Text>
        </View>

        <PflegeleistungenRechner />
      </ScrollView>
    </>
  );
}
