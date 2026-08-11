import Image from "next/image";
import Link from "next/link";
import { RegisterBetreiberForm } from "@/components/RegisterBetreiberForm";

const benefits = [
  {
    icon: "⚡",
    title: "In wenigen Minuten startklar",
    text: "Einrichtung und Ansprechpartner angeben - fertig. Kein Papierkram, keine Wartezeit.",
  },
  {
    icon: "🎁",
    title: "Dauerhaft kostenlos",
    text: "Das Verfügbarkeits-Tool kostet nichts - unabhängig davon, ob ihr euch später öffentlich auf woodaa listen lasst.",
  },
  {
    icon: "🔒",
    title: "Keine Doppelbuchung mehr",
    text: "Jeder Platz, der als belegt markiert ist, kann nicht versehentlich doppelt vergeben werden - technisch garantiert.",
  },
  {
    icon: "🌍",
    title: "Sichtbarkeit, wenn ihr wollt",
    text: "Öffentlich auf woodaa gelistet werden ist ein optionaler, zusätzlicher Schritt - ihr entscheidet, wann.",
  },
];

export default function OperatorRegisterPage() {
  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-brand-heading px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5">
          <Link href="/betreiber/login" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="woodaa"
              width={478}
              height={142}
              priority
              className="h-7 w-auto brightness-0 invert"
            />
            <span className="rounded-brand-full border border-white/30 px-2.5 py-0.5 text-xs font-medium text-white/90">
              Für Pflegeeinrichtungen
            </span>
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden bg-brand-heading px-6 py-16 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, #8BA888 0%, transparent 35%), radial-gradient(circle at 85% 15%, #2F9E71 0%, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-block rounded-brand-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/90">
            Für Pflegeeinrichtungen · kostenlos · kein Verkaufsgespräch nötig
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
            Das kostenlose Verfügbarkeits-Tool für euer Pflegeheim
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Behaltet in Sekunden den Überblick, wo wirklich noch ein Platz frei ist - statt
            Excel-Tabellen und Telefonnotizen. Kostenlos, ohne Verpflichtung, sofort einsatzbereit.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid gap-5 sm:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-brand-lg border border-brand-border bg-brand-surface p-5 shadow-sm"
            >
              <span className="text-2xl">{b.icon}</span>
              <h3 className="mt-3 text-base font-semibold text-brand-heading">{b.title}</h3>
              <p className="mt-2 text-sm text-brand-text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-surface px-6 py-16">
        <div className="mx-auto max-w-md">
          <h2 className="mb-6 text-center text-xl font-semibold text-brand-text">
            Jetzt kostenlos loslegen
          </h2>
          <RegisterBetreiberForm />
          <p className="mt-4 text-center text-xs text-brand-text-muted">
            Schon dabei?{" "}
            <Link href="/betreiber/login" className="text-brand-accent underline">
              Anmelden
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
