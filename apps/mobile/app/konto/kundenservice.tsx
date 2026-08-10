import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { AIChatWidget } from "@/components/support/AIChatWidget";
import { FAQAccordion } from "@/components/support/FAQAccordion";
import { SupportRequestForm } from "@/components/support/SupportRequestForm";
import { useAuth } from "@/lib/AuthContext";

// Mobile port of apps/web/app/hilfe/kundenservice/page.tsx +
// components/support/OperatorSupportChannels.tsx.
export default function KundenserviceScreen() {
  const { user } = useAuth();

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-3 p-6"
    >
      <Stack.Screen options={{ title: "Kundenservice" }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Häufige Fragen, Telefon, Chat oder eine persönliche Nachricht - so erreichst du uns.
      </Text>

      <SectionTitle>Häufige Fragen</SectionTitle>
      <FAQAccordion />

      <SectionTitle>Telefon (24/7)</SectionTitle>
      <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <Text className="text-brand-text dark:text-brand-text-dark">
          {/* Platzhalter - vor Live-Gang durch echte Hotline-Nummer ersetzen */}
          [Telefonnummer] - rund um die Uhr erreichbar
        </Text>
        <Text className="mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Lieber zurückgerufen werden? Nutze das Rückruf-Formular weiter unten.
        </Text>
      </View>

      <SectionTitle>KI-Chat</SectionTitle>
      <Text className="-mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Für schnelle Fragen rund um woodaa - jederzeit verfügbar.
      </Text>
      <AIChatWidget />

      <SectionTitle>Rückruf anfordern</SectionTitle>
      <Text className="-mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Wir rufen dich unter der angegebenen Nummer zurück.
      </Text>
      <SupportRequestForm type="RUECKRUF" submitLabel="Rückruf anfordern" phoneRequired />

      <SectionTitle>Nachricht schreiben</SectionTitle>
      <Text className="-mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Für alles, was etwas ausführlicher ist.
      </Text>
      <SupportRequestForm type="KONTAKT" submitLabel="Nachricht senden" />

      {user?.role === "BETREIBER" && (
        <>
          <SectionTitle>Partner-Support für Einrichtungen</SectionTitle>
          <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
            <Text className="text-brand-text dark:text-brand-text-dark">
              {/* Platzhalter - vor Live-Gang durch echte Partner-Hotline-Nummer ersetzen */}
              [Partner-Hotline] - für Fragen rund um euer Betreiber-Konto
            </Text>
            <Text className="mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
              Erreichbar Mo-Fr, 8-18 Uhr. Für dringende Fälle nutzt bitte die Nachricht unten.
            </Text>
          </View>
          <SupportRequestForm type="KONTAKT" submitLabel="Nachricht an den Partner-Support" />
        </>
      )}
    </ScrollView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mt-4 text-base font-semibold text-brand-text dark:text-brand-text-dark">
      {children}
    </Text>
  );
}
