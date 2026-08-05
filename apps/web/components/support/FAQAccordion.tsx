const faqs: { question: string; answer: string }[] = [
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
      "Nur wer eine Einrichtung bereits über woodaa gebucht hat, kann sie bewerten - auf der Einrichtungsseite findest du dazu den Button „Pflegeheim bewerten\".",
  },
  {
    question: "Wie registriere ich mein Pflegeheim bei woodaa?",
    answer:
      "Über „Pflegeheim registrieren\" im Menü - die Einrichtung ist danach zunächst nur intern für dich sichtbar, bis du sie für die öffentliche Suche freigibst.",
  },
];

export function FAQAccordion() {
  return (
    <div id="faq" className="flex flex-col gap-2">
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className="rounded-brand-md border border-brand-border bg-brand-surface p-4"
        >
          <summary className="cursor-pointer font-medium text-brand-text">
            {faq.question}
          </summary>
          <p className="mt-2 text-sm text-brand-text-muted">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
