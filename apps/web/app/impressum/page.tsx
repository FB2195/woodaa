import { Header } from "@/components/Header";

// Deliberately not localized like the other legal pages - an Impressum is
// a German TMG/MStV disclosure obligation tied to German paragraphs
// regardless of UI language, and stays in German on multilingual sites
// for that reason (unlike Datenschutz/Nutzungsbedingungen, which genuinely
// need to be understandable to the reader under GDPR Art. 12).
export default function ImpressumPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">Impressum</h1>
        <p className="mt-2 rounded-brand-md border border-brand-accent bg-brand-accent/10 p-3 text-sm text-brand-heading">
          Platzhalter: Die eckigen Klammern unten müssen vor dem Live-Gang durch die echten
          Unternehmensangaben ersetzt werden (Pflichtangaben nach § 5 TMG / § 18 Abs. 2 MStV).
        </p>

        <div className="mt-6 flex flex-col gap-6 text-brand-text">
          <div>
            <h2 className="font-semibold text-brand-heading">Angaben gemäß § 5 TMG</h2>
            <p className="mt-1 text-sm">
              [Firmenname]
              <br />
              [Straße und Hausnummer]
              <br />
              [PLZ und Ort]
              <br />
              [Land]
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">Vertreten durch</h2>
            <p className="mt-1 text-sm">[Name der/des Geschäftsführenden]</p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">Kontakt</h2>
            <p className="mt-1 text-sm">
              Telefon: [Telefonnummer]
              <br />
              E-Mail: [E-Mail-Adresse]
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">Registereintrag</h2>
            <p className="mt-1 text-sm">
              Eintragung im Handelsregister
              <br />
              Registergericht: [Registergericht]
              <br />
              Registernummer: [Registernummer]
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">Umsatzsteuer-ID</h2>
            <p className="mt-1 text-sm">
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: [USt-IdNr.]
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-brand-heading">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p className="mt-1 text-sm">
              [Name]
              <br />
              [Anschrift wie oben]
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
