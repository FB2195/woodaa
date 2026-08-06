import { BookingType, Pflegegrad, SortOption, type Weekday } from "@woodaa/validators";
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
    amenities?: string | string[];
    availableFromDate?: string;
    rangeStart?: string;
    rangeEnd?: string;
    weekdays?: string | string[];
    hoursPerDay?: string;
    onlyAvailable?: string;
  }>;
};

// yyyy-mm-dd (native <input type="date"> value) -> Date at UTC midnight, so
// this doesn't shift a day depending on the server's local timezone.
function parseDateParam(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

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
  const amenities = params.amenities
    ? Array.isArray(params.amenities)
      ? params.amenities
      : [params.amenities]
    : undefined;

  const availableFromDate = parseDateParam(params.availableFromDate);
  const rangeStart = parseDateParam(params.rangeStart);
  const rangeEnd = parseDateParam(params.rangeEnd);
  const weekdaysRaw = params.weekdays
    ? Array.isArray(params.weekdays)
      ? params.weekdays
      : [params.weekdays]
    : [];
  const weekdays = weekdaysRaw
    .map((w) => Number(w))
    .filter((w) => Number.isInteger(w) && w >= 1 && w <= 7) as Weekday[];
  const hoursPerDay = params.hoursPerDay ? Number(params.hoursPerDay) : undefined;
  // Absent (e.g. this is the very first search, no form submitted yet) also
  // defaults to true - only an explicit "false" (the unchecked box's hidden
  // input, see SearchForm) turns it off.
  const onlyAvailable = params.onlyAvailable !== "false";

  const trpcServer = await getTrpcServer();
  const {
    results: facilities,
    bookingTypeCounts,
    amenityCounts,
    usedFallbackRadius,
  } = await trpcServer.facility.list({
    city,
    bookingType: bookingType.success ? bookingType.data : undefined,
    maxPriceCents,
    radiusKm: radiusKm !== undefined && Number.isFinite(radiusKm) ? radiusKm : undefined,
    pflegegrad: pflegegrad.success ? pflegegrad.data : undefined,
    sort: sort.success ? sort.data : undefined,
    amenities,
    availableFromDate,
    rangeStart,
    rangeEnd,
    weekdays: weekdays.length ? weekdays : undefined,
    hoursPerDay: hoursPerDay !== undefined && Number.isFinite(hoursPerDay) ? hoursPerDay : undefined,
    onlyAvailable,
  });

  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <SearchForm
          defaultCity={params.city}
          defaultType={bookingType.success ? bookingType.data : undefined}
          defaultAvailableFromDate={params.availableFromDate}
          defaultRangeStart={params.rangeStart}
          defaultRangeEnd={params.rangeEnd}
          defaultWeekdays={weekdays.length ? weekdays : undefined}
          defaultHoursPerDay={hoursPerDay}
          defaultOnlyAvailable={onlyAvailable}
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
        {usedFallbackRadius && (
          <p className="mt-1 text-sm text-brand-text-muted">
            Keine Treffer direkt für „{params.city}" - hier Einrichtungen im Umkreis von 5&nbsp;km.
          </p>
        )}

        <SearchResultsView
          facilities={facilities}
          bookingTypeCounts={bookingTypeCounts}
          amenityCounts={amenityCounts}
        />
      </section>
    </main>
  );
}
