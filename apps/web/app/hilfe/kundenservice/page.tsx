import { Header } from "@/components/Header";
import { FAQAccordion } from "@/components/support/FAQAccordion";
import { AIChatWidget } from "@/components/support/AIChatWidget";
import { SupportRequestForm } from "@/components/support/SupportRequestForm";

export default function KundenservicePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-primary-dark">Kundenservice</h1>
        <p className="mt-2 text-brand-text-muted">
          Häufige Fragen, Telefon, Chat oder eine persönliche Nachricht - so erreichst du uns.
        </p>

        <h2 className="mt-10 text-lg font-semibold text-brand-text">Häufige Fragen</h2>
        <div className="mt-4">
          <FAQAccordion />
        </div>

        <h2 className="mt-10 text-lg font-semibold text-brand-text">Telefon (24/7)</h2>
        <div className="mt-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
          <p className="text-brand-text">
            {/* Platzhalter - vor Live-Gang durch echte Hotline-Nummer ersetzen */}
            [Telefonnummer] - rund um die Uhr erreichbar
          </p>
          <p className="mt-2 text-sm text-brand-text-muted">
            Lieber zurückgerufen werden? Nutze das Rückruf-Formular weiter unten.
          </p>
        </div>

        <h2 className="mt-10 text-lg font-semibold text-brand-text">KI-Chat</h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          Für schnelle Fragen rund um woodaa - jederzeit verfügbar.
        </p>
        <div className="mt-4">
          <AIChatWidget />
        </div>

        <h2 className="mt-10 text-lg font-semibold text-brand-text">Rückruf anfordern</h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          Wir rufen dich unter der angegebenen Nummer zurück.
        </p>
        <div className="mt-4">
          <SupportRequestForm type="RUECKRUF" submitLabel="Rückruf anfordern" phoneRequired />
        </div>

        <h2 className="mt-10 text-lg font-semibold text-brand-text">Nachricht schreiben</h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          Für alles, was etwas ausführlicher ist.
        </p>
        <div className="mt-4">
          <SupportRequestForm type="KONTAKT" submitLabel="Nachricht senden" />
        </div>
      </section>
    </main>
  );
}
