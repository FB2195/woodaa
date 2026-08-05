import { Header } from "@/components/Header";
import { SupportRequestForm } from "@/components/support/SupportRequestForm";

export default function FehlerMeldenPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-primary-dark">Fehler/Problem melden</h1>
        <p className="mt-2 text-brand-text-muted">
          Etwas funktioniert nicht wie erwartet? Beschreib kurz, was passiert ist - je genauer,
          desto schneller können wir helfen (z. B. was du gemacht hast und was du erwartet
          hättest).
        </p>

        <div className="mt-8">
          <SupportRequestForm type="FEHLERMELDUNG" submitLabel="Problem melden" />
        </div>
      </section>
    </main>
  );
}
