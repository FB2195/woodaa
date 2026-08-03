import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { BookingRequestForm } from "@/components/BookingRequestForm";
import { FacilityLocationMap } from "@/components/FacilityLocationMap";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Header } from "@/components/Header";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate, formatPriceEuro } from "@/lib/format";
import { pflegegradLabels } from "@/lib/pflegegradLabels";
import type { Pflegegrad } from "@woodaa/validators";
import { getTrpcServer } from "@/lib/trpc-server";

type FacilityPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function FacilityPage({ params }: FacilityPageProps) {
  const { slug } = await params;

  const trpcServer = await getTrpcServer();
  const facility = await trpcServer.facility.bySlug({ slug }).catch((err) => {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  });

  // Logged-out visitors get UNAUTHORIZED here - the favorite button just
  // starts unfilled for them (clicking it sends them to /login).
  const favoriteIds = await trpcServer.favorite
    .myFacilityIds()
    .catch((): string[] => []);
  const isFavorited = favoriteIds.includes(facility.id);

  const availableBookingTypes = facility.capacities
    .filter((capacity) => capacity.availableSlots > 0)
    .map((capacity) => capacity.bookingType);

  const weekdayLabels: Record<string, string> = {
    mon: "Mo",
    tue: "Di",
    wed: "Mi",
    thu: "Do",
    fri: "Fr",
    sat: "Sa",
    sun: "So",
  };

  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-brand-primary-dark">
              {facility.name}
            </h1>
            <FavoriteButton facilityId={facility.id} initialFavorited={isFavorited} />
          </div>
          <p className="mt-1 text-brand-text-muted">
            {facility.street}, {facility.postalCode} {facility.city},{" "}
            {facility.state}
          </p>
          {(facility.minPflegegrad !== null || facility.maxPflegegrad !== null) && (
            <p className="mt-2 text-sm text-brand-text-muted">
              Geeignet für{" "}
              {facility.minPflegegrad !== null && facility.maxPflegegrad !== null
                ? `Pflegegrad ${facility.minPflegegrad}–${facility.maxPflegegrad}`
                : pflegegradLabels[
                    (facility.minPflegegrad ?? facility.maxPflegegrad) as Pflegegrad
                  ]}
            </p>
          )}

          {facility.latitude !== null && facility.longitude !== null && (
            <FacilityLocationMap
              latitude={facility.latitude}
              longitude={facility.longitude}
              name={facility.name}
            />
          )}

          <p className="mt-6 text-brand-text">{facility.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {facility.amenities.map((amenity) => (
              <span
                key={amenity}
                className="rounded-brand-full border border-brand-border px-3 py-1 text-xs text-brand-text-muted"
              >
                {amenity}
              </span>
            ))}
          </div>

          <h2 className="mt-10 text-lg font-semibold text-brand-text">
            Verfügbarkeit
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {facility.capacities.map((capacity) => (
              <div
                key={capacity.id}
                className="rounded-brand-md border border-brand-border px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-brand-text">
                    {bookingTypeLabels[capacity.bookingType]}
                  </span>
                  <span
                    className={
                      capacity.availableSlots > 0
                        ? "font-semibold text-brand-accent"
                        : "text-brand-text-muted"
                    }
                  >
                    {capacity.availableSlots > 0
                      ? `${capacity.availableSlots} von ${capacity.totalSlots} Plätzen frei`
                      : "Aktuell belegt"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-brand-text-muted">
                  {capacity.monthlyPriceCents !== null
                    ? `${formatPriceEuro(capacity.monthlyPriceCents)}/Monat (geschätzter Eigenanteil)`
                    : "Preis auf Anfrage"}
                </p>

                {capacity.bookingType === "STATIONAERE_AUFNAHME" &&
                  capacity.availableSlots === 0 &&
                  capacity.availableFrom && (
                    <p className="mt-1 text-sm text-brand-text-muted">
                      Nächster freier Platz voraussichtlich ab{" "}
                      {formatDate(capacity.availableFrom)}
                    </p>
                  )}

                {capacity.bookingType === "TAGES_NACHTPFLEGE" &&
                  capacity.weekdaySlots && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-brand-text-muted">
                      {Object.entries(
                        capacity.weekdaySlots as Record<string, number>,
                      ).map(([day, slots]) => (
                        <span
                          key={day}
                          className="rounded-brand-full border border-brand-border px-2 py-1"
                        >
                          {weekdayLabels[day] ?? day}: {slots}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ))}

            {facility.kurzzeitpflegeBookings.length > 0 && (
              <div className="rounded-brand-md border border-brand-border px-4 py-3">
                <p className="text-sm font-medium text-brand-text">
                  Belegte Zeiträume Kurzzeitpflege
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-sm text-brand-text-muted">
                  {facility.kurzzeitpflegeBookings.map((booking) => (
                    <li key={booking.id}>
                      {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div>
          <BookingRequestForm
            facilityId={facility.id}
            availableBookingTypes={availableBookingTypes}
          />
        </div>
      </section>
    </main>
  );
}
