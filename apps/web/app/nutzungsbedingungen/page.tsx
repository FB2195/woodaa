import { Header } from "@/components/Header";

export default function NutzungsbedingungenPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">Nutzungsbedingungen</h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Diese Seite fasst zusammen, wie woodaa genutzt werden darf. Sie ersetzt keine
          rechtliche Prüfung - bitte vor Live-Schaltung anwaltlich gegenprüfen lassen.
        </p>

        <div className="mt-8 flex flex-col gap-6 text-brand-text">
          <div>
            <h2 className="font-semibold text-brand-heading">Leistungsbeschreibung</h2>
            <p className="mt-1 text-sm">
              woodaa vermittelt zwischen Pflegeeinrichtungen und Personen, die einen
              Pflegeplatz suchen - inklusive Echtzeit-Verfügbarkeit, verbindlicher
              Online-Buchung und Zahlungsabwicklung. woodaa ist nicht selbst Betreiber der
              gelisteten Einrichtungen.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">Registrierung</h2>
            <p className="mt-1 text-sm">
              Für eine Buchung oder das Anlegen einer Einrichtung ist ein Konto mit
              wahrheitsgemäßen Angaben erforderlich. Du bist für die Richtigkeit deiner
              Angaben und die Sicherheit deines Passworts selbst verantwortlich.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">Buchungen</h2>
            <p className="mt-1 text-sm">
              Eine Online-Buchung über woodaa ist sofort verbindlich. Stornobedingungen und
              Zahlungsabwicklung sind in der Buchungsstrecke sowie in den Angaben der
              jeweiligen Einrichtung beschrieben.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">Pflichten der Einrichtungen</h2>
            <p className="mt-1 text-sm">
              Einrichtungen sind verpflichtet, Verfügbarkeit, Preise und Kontaktdaten
              wahrheitsgemäß und aktuell zu pflegen. Änderungen an Name, Adresse und
              Ansprechpartner werden vor der Veröffentlichung geprüft.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">Haftung</h2>
            <p className="mt-1 text-sm">
              woodaa haftet nicht für die Richtigkeit der von Einrichtungen bereitgestellten
              Angaben oder für die tatsächliche Pflegequalität vor Ort. Für Vorsatz und grobe
              Fahrlässigkeit gilt diese Beschränkung nicht.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">Änderungen dieser Bedingungen</h2>
            <p className="mt-1 text-sm">
              Wir können diese Nutzungsbedingungen bei Bedarf anpassen. Über wesentliche
              Änderungen informieren wir registrierte Nutzer:innen rechtzeitig.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
