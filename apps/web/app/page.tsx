const bookingTypes = [
  {
    title: "Stationäre Aufnahme",
    description: "Dauerhafter Pflegeplatz für die langfristige Versorgung.",
  },
  {
    title: "Kurzzeitpflege",
    description:
      "Zeitlich befristeter Aufenthalt, z. B. nach einem Krankenhausaufenthalt.",
  },
  {
    title: "Tages- & Nachtpflege",
    description: "Teilstationäre Betreuung ohne durchgängige Übernachtung.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-xl font-semibold text-brand-primary-dark">
            Woodaa
          </span>
          <nav className="flex items-center gap-6 text-sm text-brand-text-muted">
            <span>Für Pflegeeinrichtungen</span>
            <span className="rounded-brand-full bg-brand-primary px-4 py-2 text-white">
              Einrichtung eintragen
            </span>
          </nav>
        </div>
      </header>

      <section className="bg-brand-primary-dark px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Den richtigen Pflegeplatz finden – so einfach wie ein Hotel buchen.
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Woodaa verbindet Familien mit geprüften Pflegeeinrichtungen in
            ganz Deutschland.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-brand-text">
          Welche Art von Pflege wird gesucht?
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {bookingTypes.map((type) => (
            <div
              key={type.title}
              className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-brand-primary-dark">
                {type.title}
              </h3>
              <p className="mt-2 text-sm text-brand-text-muted">
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-brand-border px-6 py-8 text-center text-sm text-brand-text-muted">
        Woodaa · in Entwicklung · Phase 0
      </footer>
    </main>
  );
}
