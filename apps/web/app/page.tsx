import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { Header } from "@/components/Header";
import { SearchForm } from "@/components/search/SearchForm";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />

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

        <SearchForm className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-brand-lg bg-brand-surface p-4 shadow-lg sm:flex-row" />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-brand-text">
          Welche Art von Pflege wird gesucht?
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {bookingTypeOptions.map((option) => (
            <a
              key={option.value}
              href={`/suche?type=${option.value}`}
              className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-brand-primary-dark">
                {option.label}
              </h3>
              <p className="mt-2 text-sm text-brand-text-muted">
                Passende Einrichtungen ansehen →
              </p>
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-brand-border px-6 py-8 text-center text-sm text-brand-text-muted">
        Woodaa · in Entwicklung · Phase 1
      </footer>
    </main>
  );
}
