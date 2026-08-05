import Link from "next/link";
import { Header } from "@/components/Header";

export default function HilfePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">Hilfe &amp; Support</h1>
        <p className="mt-2 text-brand-text-muted">
          Hier findest du Antworten auf häufige Fragen und alle Wege, uns zu erreichen.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <Link
            href="/hilfe/kundenservice"
            className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 transition hover:border-brand-accent"
          >
            <h2 className="font-semibold text-brand-heading">Kundenservice</h2>
            <p className="mt-1 text-sm text-brand-text-muted">
              FAQ, Telefon-Hotline (24/7), KI-Chat, Rückruf anfordern oder eine individuelle
              Nachricht schreiben.
            </p>
          </Link>

          <Link
            href="/fehler-melden"
            className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 transition hover:border-brand-accent"
          >
            <h2 className="font-semibold text-brand-heading">Fehler/Problem melden</h2>
            <p className="mt-1 text-sm text-brand-text-muted">
              Etwas funktioniert nicht wie erwartet? Sag uns kurz, was los ist.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
