import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-1">
      <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        {title}
      </Text>
      <Text className="text-sm text-brand-text dark:text-brand-text-dark">{children}</Text>
    </View>
  );
}

// Mobile port of apps/web/app/nutzungsbedingungen/page.tsx - gleicher Text.
export default function NutzungsbedingungenScreen() {
  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-6 p-6"
    >
      <Stack.Screen options={{ title: "Nutzungsbedingungen" }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Diese Seite fasst zusammen, wie woodaa genutzt werden darf. Sie ersetzt keine rechtliche
        Prüfung - bitte vor Live-Schaltung anwaltlich gegenprüfen lassen.
      </Text>

      <Section title="Leistungsbeschreibung">
        woodaa vermittelt zwischen Pflegeeinrichtungen und Personen, die einen Pflegeplatz suchen -
        inklusive Echtzeit-Verfügbarkeit, verbindlicher Online-Buchung und Zahlungsabwicklung.
        woodaa ist nicht selbst Betreiber der gelisteten Einrichtungen.
      </Section>

      <Section title="Registrierung">
        Für eine Buchung oder das Anlegen einer Einrichtung ist ein Konto mit wahrheitsgemäßen
        Angaben erforderlich. Du bist für die Richtigkeit deiner Angaben und die Sicherheit deines
        Passworts selbst verantwortlich.
      </Section>

      <Section title="Buchungen">
        Eine Online-Buchung über woodaa ist sofort verbindlich. Stornobedingungen und
        Zahlungsabwicklung sind in der Buchungsstrecke sowie in den Angaben der jeweiligen
        Einrichtung beschrieben.
      </Section>

      <Section title="Pflichten der Einrichtungen">
        Einrichtungen sind verpflichtet, Verfügbarkeit, Preise und Kontaktdaten wahrheitsgemäß und
        aktuell zu pflegen. Änderungen an Name, Adresse und Ansprechpartner werden vor der
        Veröffentlichung geprüft.
      </Section>

      <Section title="Haftung">
        woodaa haftet nicht für die Richtigkeit der von Einrichtungen bereitgestellten Angaben oder
        für die tatsächliche Pflegequalität vor Ort. Für Vorsatz und grobe Fahrlässigkeit gilt
        diese Beschränkung nicht.
      </Section>

      <Section title="Änderungen dieser Bedingungen">
        Wir können diese Nutzungsbedingungen bei Bedarf anpassen. Über wesentliche Änderungen
        informieren wir registrierte Nutzer:innen rechtzeitig.
      </Section>
    </ScrollView>
  );
}
