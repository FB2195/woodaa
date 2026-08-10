import { useState } from "react";
import { Pressable, Text, View } from "react-native";

const userFaqs: { question: string; answer: string }[] = [
  {
    question: "Wie finde ich einen passenden Pflegeplatz?",
    answer:
      "Gib in der Suche Stadt oder PLZ ein und wähle optional Pflegeart, Umkreis und Pflegegrad aus. Du siehst sofort, welche Einrichtungen freie Plätze haben.",
  },
  {
    question: "Wie funktioniert die Buchung?",
    answer:
      "Nach dem Login kannst du einen freien Platz direkt und verbindlich buchen - wie bei einem Hotel. Der Platz wird sofort für dich reserviert.",
  },
  {
    question: "Wie wird mein voraussichtlicher Eigenanteil berechnet?",
    answer:
      "Auf jeder Einrichtungsseite und beim Buchen zeigen wir dir eine Einschätzung auf Basis deines Pflegegrads und der von der Einrichtung hinterlegten Sätze. Die tatsächliche Höhe bestätigt am Ende deine Pflegekasse.",
  },
  {
    question: "Kann ich eine Buchung stornieren?",
    answer:
      "Ja, bis 48 Stunden vor dem geplanten Termin kostenlos - danach sprich bitte direkt mit der Einrichtung.",
  },
  {
    question: "Wie bezahle ich?",
    answer:
      "Per Kreditkarte, Klarna oder PayPal direkt über woodaa, oder per Rechnung/Kostenübernahme durch die Pflegekasse - je nachdem, was die Einrichtung anbietet.",
  },
  {
    question: "Ich habe noch keinen Pflegegrad - kann ich trotzdem buchen?",
    answer:
      "Ja. Gib beim Buchen an, dass noch kein Pflegegrad vorliegt oder ein Antrag läuft - wir helfen dir sogar, den Antrag digital bei deiner Pflegekasse einzureichen.",
  },
  {
    question: "Wie kann ich eine Einrichtung bewerten?",
    answer:
      'Nur wer eine Einrichtung bereits über woodaa gebucht hat, kann sie bewerten - auf der Einrichtungsseite findest du dazu den Button „Pflegeheim bewerten".',
  },
];

const facilityFaqs: { question: string; answer: string }[] = [
  {
    question: "Wie registriere ich mein Pflegeheim bei woodaa?",
    answer:
      'Über „Pflegeheim registrieren" im Menü - die Einrichtung ist danach zunächst nur intern für dich sichtbar, bis unser Team sie für die öffentliche Suche freigibt.',
  },
  {
    question: "Kostet das Verfügbarkeits-Tool etwas?",
    answer:
      "Nein, es ist dauerhaft kostenlos nutzbar - unabhängig davon, ob ihr euch öffentlich auf woodaa listen lasst.",
  },
  {
    question: "Wie pflege ich unsere freien Plätze und Preise?",
    answer:
      "Alles läuft über euer Betreiber-Dashboard nach dem Login - dort verwaltet ihr Verfügbarkeiten, Pflegegrad-Preise und eure Einrichtungsdaten selbst.",
  },
  {
    question: "Wie werden Buchungen bestätigt?",
    answer:
      "Direktbuchungen über woodaa sind sofort verbindlich und reservieren den Platz automatisch - Doppelbuchungen sind technisch ausgeschlossen.",
  },
];

function FAQItem({ faq }: { faq: { question: string; answer: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      className="rounded-brand-md border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark"
    >
      <Text className="font-medium text-brand-text dark:text-brand-text-dark">
        {faq.question}
      </Text>
      {open && (
        <Text className="mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          {faq.answer}
        </Text>
      )}
    </Pressable>
  );
}

function FAQList({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <View className="gap-2">
      {faqs.map((faq) => (
        <FAQItem key={faq.question} faq={faq} />
      ))}
    </View>
  );
}

// Mobile port of apps/web/components/support/FAQAccordion.tsx - <details>
// hat keine RN-Entsprechung, daher ein Pressable mit lokalem open-State pro
// Frage statt nativer Accordion-Semantik.
export function FAQAccordion() {
  return (
    <View className="gap-6">
      <View>
        <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text-muted dark:text-brand-text-muted-dark">
          Für Nutzer
        </Text>
        <FAQList faqs={userFaqs} />
      </View>
      <View>
        <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text-muted dark:text-brand-text-muted-dark">
          Für Einrichtungen
        </Text>
        <FAQList faqs={facilityFaqs} />
      </View>
    </View>
  );
}
