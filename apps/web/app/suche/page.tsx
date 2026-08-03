import { BookingType, Pflegegrad, SortOption } from "@woodaa/validators";
import { Header } from "@/components/Header";
import { SearchForm } from "@/components/search/SearchForm";
import { SearchResultsView } from "@/components/search/SearchResultsView";
import { getTrpcServer } from "@/lib/trpc-server";

type SearchPageProps = {
  searchParams: Promise<{
    city?: string;
    type?: string;
    maxPrice?: string;
    radius?: string;
    pflegegrad?: string;
    sort?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const bookingType = BookingType.safeParse(params.type);
  const city = params.city?.trim() ? params.city.trim() : undefined;

  const maxPriceEuros = params.maxPrice ? Number(params.maxPrice) : undefined;
  const maxPriceCents =
    maxPriceEuros !== undefined && Number.isFinite(maxPriceEuros)
      ? Math.round(maxPriceEuros * 100)
      : undefined;

  const radiusKm = params.radius ? Number(params.radius) : undefined;
  const pflegegrad = Pflegegrad.safeParse(
    params.pflegegrad ? Number(params.pflegegrad) : undefined,
  );
  const sort = SortOption.safeParse(params.sort);

  const trpcServer = await getTrpcServer();
  const facilities = await trpcServer.facility.list({
    city,
    bookingType: bookingType.success ? bookingType.data : undefined,
    maxPriceCents,
    radiusKm: radiusKm !== undefined && Number.isFinite(radiusKm) ? radiusKm : undefined,
    pflegegrad: pflegegrad.success ? pflegegrad.data : undefined,
    sort: sort.success ? sort.data : undefined,
  });

  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <SearchForm
          defaultCity={params.city}
          defaultType={bookingType.success ? bookingType.data : undefined}
          defaultMaxPrice={maxPriceEuros}
          defaultRadiusKm={radiusKm}
          defaultPflegegrad={pflegegrad.success ? pflegegrad.data : undefined}
          defaultSort={sort.success ? sort.data : undefined}
          showFilters
          className="mb-8 flex flex-col flex-wrap gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 sm:flex-row"
        />

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
          <SearchResultsView facilities={facilities} />
        )}
      </section>
    </main>
  );
}
