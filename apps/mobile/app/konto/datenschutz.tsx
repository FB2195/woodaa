import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-1">
      <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        {title}
      </Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-sm text-brand-text dark:text-brand-text-dark">{children}</Text>
  );
}

// Mobile port of apps/web/app/datenschutz/page.tsx - gleicher Text.
export default function DatenschutzScreen() {
  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-6 p-6"
    >
      <Stack.Screen options={{ title: "Datenschutz" }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Diese Seite fasst zusammen, welche Daten woodaa verarbeitet und wofür. Sie ersetzt keine
        rechtliche Prüfung - bitte vor Live-Schaltung von einer/einem Datenschutzbeauftragten
        gegenprüfen lassen.
      </Text>

      <Section title="Verantwortlicher">
        <P>[Firmenname], [Adresse] - siehe Impressum.</P>
      </Section>

      <Section title="Welche Daten wir verarbeiten">
        <P>• Kontodaten: Name, E-Mail-Adresse, Passwort (verschlüsselt gespeichert)</P>
        <P>
          • Pflegebezogene Daten (nur wenn du sie angibst): Pflegegrad, Krankenkasse,
          Versicherungsnummer (verschlüsselt gespeichert, AES-256), Angaben zur gepflegten Person
        </P>
        <P>• Buchungsdaten: gewünschte Einrichtung, Zeitraum, Zahlungsart, Zahlungsstatus</P>
        <P>
          • Zahlungsdaten: werden direkt von unserem Zahlungsdienstleister Stripe verarbeitet, wir
          sehen keine vollständigen Kartendaten
        </P>
        <P>• Bewertungen: Name (öffentlich sichtbar), Bewertungstext</P>
        <P>
          • Standortangaben bei der Suche (Stadt/PLZ), verarbeitet über Google Maps/Places zur
          Umkreis- und Kartenanzeige
        </P>
        <P>• Technisch notwendige Cookies/App-Session, um dich eingeloggt zu halten</P>
      </Section>

      <Section title="Wofür wir sie nutzen">
        <P>
          Ausschließlich zur Bereitstellung des Dienstes: Kontoverwaltung, Suche und Buchung von
          Pflegeplätzen, Kommunikation mit Einrichtungen, Zahlungsabwicklung, Berechnung des
          voraussichtlichen Pflegekassen-Zuschusses. Kein Verkauf von Daten an Dritte, keine
          Werbe- oder Tracking-Cookies.
        </P>
      </Section>

      <Section title="Eingesetzte Dienstleister">
        <P>• Stripe (Zahlungsabwicklung)</P>
        <P>• Resend (Versand von E-Mails, z. B. Buchungsbestätigungen)</P>
        <P>• Cloudflare R2 (Speicherung hochgeladener Dokumente, z. B. Vollmachten)</P>
        <P>• Google Maps/Places (Kartenanzeige und Adressvorschläge)</P>
        <P>
          • Hosting- und Datenbank-Infrastruktur in der EU/den USA (Auftragsverarbeitung
          vertraglich geregelt)
        </P>
      </Section>

      <Section title="Deine Rechte">
        <P>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit und Widerspruch gegen die Verarbeitung deiner Daten. Wende dich
          dazu über den Kundenservice an uns. Du kannst dich außerdem bei einer
          Datenschutz-Aufsichtsbehörde beschweren.
        </P>
      </Section>

      <Section title="Speicherdauer">
        <P>
          Wir speichern Daten nur so lange, wie es für die genannten Zwecke oder aufgrund
          gesetzlicher Aufbewahrungspflichten erforderlich ist. Konten und zugehörige Daten kannst
          du jederzeit über den Kundenservice löschen lassen.
        </P>
      </Section>
    </ScrollView>
  );
}
