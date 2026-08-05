import { Header } from "@/components/Header";

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-primary-dark">Datenschutzerklärung</h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Diese Seite fasst zusammen, welche Daten woodaa verarbeitet und wofür. Sie ersetzt
          keine rechtliche Prüfung - bitte vor Live-Schaltung von einer/einem
          Datenschutzbeauftragten gegenprüfen lassen.
        </p>

        <div className="mt-8 flex flex-col gap-6 text-brand-text">
          <div>
            <h2 className="font-semibold text-brand-primary-dark">Verantwortlicher</h2>
            <p className="mt-1 text-sm">
              [Firmenname], [Adresse] - siehe{" "}
              <a href="/impressum" className="underline">
                Impressum
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-primary-dark">Welche Daten wir verarbeiten</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Kontodaten: Name, E-Mail-Adresse, Passwort (verschlüsselt gespeichert)</li>
              <li>
                Pflegebezogene Daten (nur wenn du sie angibst): Pflegegrad, Krankenkasse,
                Versicherungsnummer (verschlüsselt gespeichert, AES-256), Angaben zur
                gepflegten Person
              </li>
              <li>Buchungsdaten: gewünschte Einrichtung, Zeitraum, Zahlungsart, Zahlungsstatus</li>
              <li>Zahlungsdaten: werden direkt von unserem Zahlungsdienstleister Stripe verarbeitet, wir sehen keine vollständigen Kartendaten</li>
              <li>Bewertungen: Name (öffentlich sichtbar), Bewertungstext</li>
              <li>Standortangaben bei der Suche (Stadt/PLZ), verarbeitet über Google Maps/Places zur Umkreis- und Kartenanzeige</li>
              <li>Technisch notwendige Cookies, um dich eingeloggt zu halten (siehe Cookie-Infos)</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-brand-primary-dark">Wofür wir sie nutzen</h2>
            <p className="mt-1 text-sm">
              Ausschließlich zur Bereitstellung des Dienstes: Kontoverwaltung, Suche und
              Buchung von Pflegeplätzen, Kommunikation mit Einrichtungen, Zahlungsabwicklung,
              Berechnung des voraussichtlichen Pflegekassen-Zuschusses. Kein Verkauf von Daten
              an Dritte, keine Werbe- oder Tracking-Cookies.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-primary-dark">Eingesetzte Dienstleister</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Stripe (Zahlungsabwicklung)</li>
              <li>Resend (Versand von E-Mails, z. B. Buchungsbestätigungen)</li>
              <li>Cloudflare R2 (Speicherung hochgeladener Dokumente, z. B. Vollmachten)</li>
              <li>Google Maps/Places (Kartenanzeige und Adressvorschläge)</li>
              <li>Hosting- und Datenbank-Infrastruktur in der EU/den USA (Auftragsverarbeitung vertraglich geregelt)</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-brand-primary-dark">Deine Rechte</h2>
            <p className="mt-1 text-sm">
              Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
              Verarbeitung, Datenübertragbarkeit und Widerspruch gegen die Verarbeitung deiner
              Daten. Wende dich dazu über das{" "}
              <a href="/hilfe/kundenservice" className="underline">
                Kontaktformular
              </a>{" "}
              an uns. Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde
              beschweren.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-primary-dark">Speicherdauer</h2>
            <p className="mt-1 text-sm">
              Wir speichern Daten nur so lange, wie es für die genannten Zwecke oder aufgrund
              gesetzlicher Aufbewahrungspflichten erforderlich ist. Konten und zugehörige Daten
              kannst du jederzeit über den Kundenservice löschen lassen.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
