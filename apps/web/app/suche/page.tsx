import { BookingType } from "@woodaa/validators";
import { FacilityCard } from "@/components/FacilityCard";
import { trpcServer } from "@/lib/trpc-server";

type SearchPageProps = {
  searchParams: Promise<{ city?: string; type?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const bookingType = BookingType.safeParse(params.type);
  const city = params.city?.trim() ? params.city.trim() : undefined;

  const facilities = await trpcServer.facility.list({
    city,
    bookingType: bookingType.success ? bookingType.data : undefined,
  });

  return (
    <main className="min-h-screen">
      <header className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-semibold text-brand-primary-dark">
            Woodaa
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-brand-text">
          {params.city
            ? `Pflegeplätze in ${params.city}`
            : "Alle Pflegeplätze"}
        </h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          {facilities.length}{" "}
          {facilities.length === 1 ? "Einrichtung gefunden" : "Einrichtungen gefunden"}
        </p>

        {facilities.length === 0 ? (
          <p className="mt-10 rounded-brand-lg border border-brand-border bg-brand-surface p-8 text-center text-brand-text-muted">
            Keine Einrichtungen gefunden. Versuche eine andere Stadt oder
            Pflegeart.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
