import { Header } from "@/components/Header";
import { PflegeleistungenRechner } from "@/components/PflegeleistungenRechner";

export default function PflegeleistungenBerechnenPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">Pflegeleistungen berechnen</h1>
        <p className="mt-2 text-brand-text-muted">
          Wähle Pflegeart und Pflegegrad, trag die Heimkosten ein - für Kurzzeitpflege zusätzlich,
          wie viel du dieses Jahr schon genutzt hast - und sieh sofort deinen voraussichtlichen
          Eigenanteil.
        </p>

        <div className="mt-8">
          <PflegeleistungenRechner />
        </div>
      </section>
    </main>
  );
}
