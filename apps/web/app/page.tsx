import Image from "next/image";
import Link from "next/link";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection, OperatorCtaSection, WhySection } from "@/components/home/WhyAndHowSection";
import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";
import { getTrpcServer } from "@/lib/trpc-server";

const bookingTypeIcons: Record<string, string> = {
  STATIONAERE_AUFNAHME: "🏡",
  KURZZEITPFLEGE: "🩺",
  TAGESPFLEGE: "☀️",
  NACHTPFLEGE: "🌙",
};

export default async function HomePage() {
  const trpcServer = await getTrpcServer();
  const { results: facilities } = await trpcServer.facility.list({});

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

      <HeroSection facilityCount={facilities.length} cityCount={cityInfo.size} />

      <WhySection />

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

      <section className="bg-brand-surface-alt px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-brand-text">
            Welche Art von Pflege wird gesucht?
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bookingTypeOptions.map((option) => (
              <Link
                key={option.value}
                href={`/suche?type=${option.value}`}
                className="group rounded-brand-lg border border-brand-border bg-brand-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-md"
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

      <HowItWorksSection />

      <OperatorCtaSection />
    </main>
  );
}
