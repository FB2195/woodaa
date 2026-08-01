import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { Header } from "@/components/Header";

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

        <form
          action="/suche"
          method="GET"
          className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-brand-lg bg-brand-surface p-4 shadow-lg sm:flex-row"
        >
          <input
            type="text"
            name="city"
            placeholder="Stadt oder PLZ, z. B. Berlin"
            className="flex-1 rounded-brand-md border border-brand-border px-4 py-3 text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <select
            name="type"
            defaultValue=""
            className="rounded-brand-md border border-brand-border px-4 py-3 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">Alle Pflegearten</option>
            {bookingTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Suchen
          </button>
        </form>
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
