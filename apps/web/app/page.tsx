import Image from "next/image";
import Link from "next/link";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { Header } from "@/components/Header";
import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";
import { SearchForm } from "@/components/search/SearchForm";
import { getTrpcServer } from "@/lib/trpc-server";

const bookingTypeIcons: Record<string, string> = {
  STATIONAERE_AUFNAHME: "🏡",
  KURZZEITPFLEGE: "🩺",
  TAGESPFLEGE: "☀️",
  NACHTPFLEGE: "🌙",
};

const trustPoints = [
  {
    icon: "⚡",
    title: "Echtzeit-Verfügbarkeit",
    text: "Kein Rätselraten am Telefon - Sie sehen sofort, wo aktuell wirklich ein Platz frei ist.",
  },
  {
    icon: "🔒",
    title: "Keine Doppelbuchung",
    text: "Jeder gebuchte Platz wird technisch abgesichert reserviert - garantiert kein Verwechseln, keine Doppelvergabe.",
  },
  {
    icon: "✅",
    title: "Geprüfte Einrichtungen",
    text: "Jede Einrichtung wird vor der Veröffentlichung von uns geprüft, bevor sie sichtbar wird.",
  },
  {
    icon: "🤝",
    title: "Kostenlos & unverbindlich anfragen",
    text: "Erst in Ruhe informieren, dann entscheiden - eine Anfrage kostet nichts und verpflichtet zu nichts.",
  },
];

const steps = [
  {
    icon: "🔍",
    title: "Suchen",
    text: "Ort, Pflegeart und Budget eingeben - Woodaa zeigt sofort, wo aktuell wirklich ein Platz frei ist.",
  },
  {
    icon: "✅",
    title: "Buchen oder anfragen",
    text: "Direkt verbindlich buchen oder erst unverbindlich Kontakt aufnehmen - du entscheidest das Tempo.",
  },
  {
    icon: "🤝",
    title: "Ankommen",
    text: "Die Einrichtung ist informiert und bereitet den Einzug vor. Kein Hin- und Herfaxen, keine Doppelbuchung.",
  },
];

export default async function HomePage() {
  const trpcServer = await getTrpcServer();
  const facilities = await trpcServer.facility.list({});

  const cityInfo = new Map<string, { count: number; photoUrl: string | null }>();
  for (const f of facilities) {
    const existing = cityInfo.get(f.city);
    if (existing) {
      existing.count += 1;
    } else {
      cityInfo.set(f.city, { count: 1, photoUrl: f.photos[0]?.url ?? null });
    }
  }
  const popularCities = [...cityInfo.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  return (
    <main className="min-h-screen">
      <Header />

      <section className="relative overflow-hidden bg-brand-primary-dark px-6 py-20 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, #8BA888 0%, transparent 35%), radial-gradient(circle at 85% 15%, #2F7D4F 0%, transparent 40%), radial-gradient(circle at 50% 90%, #A3C77A 0%, transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-brand-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/90">
            Deutschlandweit · geprüfte Einrichtungen · Verfügbarkeit in Echtzeit
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Den richtigen Pflegeplatz finden – so einfach wie ein Hotel buchen.
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Woodaa verbindet Familien mit geprüften Pflegeeinrichtungen in
            ganz Deutschland.
          </p>
        </div>

        <SearchForm
          showRadius
          className="relative mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-brand-lg bg-brand-surface p-4 shadow-lg sm:flex-row"
        />

        <div className="relative mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/70">
          <span>
            <strong className="text-white">{facilities.length}</strong> Einrichtungen
          </span>
          <span>
            <strong className="text-white">{cityInfo.size}</strong> Städte
          </span>
          <span>
            <strong className="text-white">4</strong> Pflegearten
          </span>
          <span>
            <strong className="text-white">sofort</strong> verbindlich buchbar
          </span>
        </div>
      </section>

      <section className="border-b border-brand-border bg-brand-surface px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-brand-text">
            Warum Woodaa?
          </h2>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {trustPoints.map((point) => (
              <div
                key={point.title}
                className="w-64 shrink-0 rounded-brand-lg border border-brand-border bg-brand-background p-5 shadow-sm"
              >
                <span className="text-3xl">{point.icon}</span>
                <h3 className="mt-3 text-base font-semibold text-brand-primary-dark">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm text-brand-text-muted">
                  {point.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {popularCities.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold text-brand-text">
            Beliebte Städte
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {popularCities.map(([city, info]) => (
              <Link
                key={city}
                href={`/suche?city=${encodeURIComponent(city)}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-brand-lg shadow-sm transition hover:shadow-md"
              >
                {info.photoUrl ? (
                  <Image
                    src={info.photoUrl}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <PlaceholderPhoto
                    category="AUSSENANSICHT"
                    seed={city}
                    className="absolute inset-0 h-full w-full transition duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="font-semibold">{city}</p>
                  <p className="text-xs text-white/80">
                    {info.count} {info.count === 1 ? "Einrichtung" : "Einrichtungen"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-brand-surface px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-brand-text">
            Welche Art von Pflege wird gesucht?
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bookingTypeOptions.map((option) => (
              <Link
                key={option.value}
                href={`/suche?type=${option.value}`}
                className="group rounded-brand-lg border border-brand-border bg-brand-background p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-md"
              >
                <span className="text-3xl">{bookingTypeIcons[option.value]}</span>
                <h3 className="mt-3 text-lg font-semibold text-brand-primary-dark">
                  {option.label}
                </h3>
                <p className="mt-2 text-sm text-brand-text-muted">
                  Passende Einrichtungen ansehen{" "}
                  <span className="transition group-hover:translate-x-1">→</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-brand-text">So funktioniert Woodaa</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-brand-full bg-brand-accent/10 text-2xl">
                {step.icon}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-accent">
                Schritt {index + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-brand-primary-dark">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-brand-text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-primary-dark px-6 py-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-xl font-semibold">Du betreibst eine Pflegeeinrichtung?</h2>
            <p className="mt-1 text-white/80">
              Zeig deine echte Verfügbarkeit auf Woodaa - ohne Mehraufwand für dein Team.
            </p>
          </div>
          <Link
            href="/betreiber/registrieren"
            className="shrink-0 rounded-brand-md bg-white px-6 py-3 font-semibold text-brand-primary-dark transition hover:opacity-90"
          >
            Einrichtung registrieren
          </Link>
        </div>
      </section>

      <footer className="border-t border-brand-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center text-sm text-brand-text-muted sm:flex-row sm:justify-between sm:text-left">
          <p>Woodaa · in Entwicklung · Phase 1</p>
          <nav className="flex gap-6">
            <Link href="/suche" className="hover:text-brand-text">
              Pflegeplätze suchen
            </Link>
            <Link href="/betreiber/registrieren" className="hover:text-brand-text">
              Für Pflegeeinrichtungen
            </Link>
            <Link href="/login" className="hover:text-brand-text">
              Login
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
