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

// Mobile port of apps/web/app/impressum/page.tsx - gleicher Text
// (inklusive der Platzhalter-Angaben, die vor Live-Gang ersetzt werden
// müssen).
export default function ImpressumScreen() {
  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-6 p-6"
    >
      <Stack.Screen options={{ title: "Impressum" }} />
      <View className="rounded-brand-md border border-brand-accent bg-brand-accent/10 p-3">
        <Text className="text-sm text-brand-primary-dark dark:text-brand-heading-dark">
          Platzhalter: Die eckigen Klammern unten müssen vor dem Live-Gang durch die echten
          Unternehmensangaben ersetzt werden (Pflichtangaben nach § 5 TMG / § 18 Abs. 2 MStV).
        </Text>
      </View>

      <Section title="Angaben gemäß § 5 TMG">
        {"[Firmenname]\n[Straße und Hausnummer]\n[PLZ und Ort]\n[Land]"}
      </Section>

      <Section title="Vertreten durch">[Name der/des Geschäftsführenden]</Section>

      <Section title="Kontakt">{"Telefon: [Telefonnummer]\nE-Mail: [E-Mail-Adresse]"}</Section>

      <Section title="Registereintrag">
        {"Eintragung im Handelsregister\nRegistergericht: [Registergericht]\nRegisternummer: [Registernummer]"}
      </Section>

      <Section title="Umsatzsteuer-ID">
        Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: [USt-IdNr.]
      </Section>

      <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        {"[Name]\n[Anschrift wie oben]"}
      </Section>
    </ScrollView>
  );
}
