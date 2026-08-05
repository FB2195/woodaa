import { Header } from "@/components/Header";

export default function UeberUnsPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">Über uns</h1>
        <div className="mt-6 flex flex-col gap-4 text-brand-text">
          <p>
            woodaa verbindet Familien mit Pflegeeinrichtungen in Deutschland - stationäre
            Aufnahme, Kurzzeitpflege und Tages-/Nachtpflege lassen sich bei uns genauso einfach
            finden und buchen wie ein Hotelzimmer.
          </p>
          <p>
            Der Name ist ein Wortspiel: <strong>Wo? Da!</strong> - weil wir glauben, dass die
            Suche nach dem richtigen Pflegeplatz nicht wochenlanges Telefonieren und Warten
            bedeuten muss. Wir zeigen echte, verfügbare Plätze, echte Preise je Pflegegrad und
            machen die Buchung sofort verbindlich - für Angehörige eine enorme Entlastung in
            einer ohnehin belastenden Situation.
          </p>
          <p>
            Pflegeeinrichtungen profitieren im Gegenzug von einem modernen Verfügbarkeits- und
            Buchungstool, das ihnen hilft, freie Plätze schneller und mit weniger
            Verwaltungsaufwand zu besetzen.
          </p>
        </div>
      </section>
    </main>
  );
}
