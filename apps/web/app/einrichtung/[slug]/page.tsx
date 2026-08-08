import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { BookingSidebar } from "@/components/BookingSidebar";
import { FacilityGalleryAndMap } from "@/components/FacilityGalleryAndMap";
import { FacilityNeighborhood } from "@/components/FacilityNeighborhood";
import { FacilityReviews } from "@/components/FacilityReviews";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Header } from "@/components/Header";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { WaitlistRowCTA } from "@/components/WaitlistRowCTA";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate, formatPriceEuro } from "@/lib/format";
import { pflegegradLabels } from "@/lib/pflegegradLabels";
import type { Pflegegrad } from "@woodaa/validators";
import { getTrpcServer } from "@/lib/trpc-server";
import { PflegekassenZuschussRechner } from "@/components/PflegekassenZuschussRechner";

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
  const favoriteIds = await trpcServer.favorite.myFacilityIds().catch((): string[] => []);
  const isFavorited = favoriteIds.includes(facility.id);

  const availableBookingTypes = facility.capacities
    .filter((capacity) => capacity.availableSlots > 0)
    .map((capacity) => capacity.bookingType);
  const allBookingTypes = facility.capacities.map((capacity) => capacity.bookingType);

  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-brand-heading">{facility.name}</h1>
              {facility.verifiedAt && <VerifiedBadge />}
            </div>
            <FavoriteButton facilityId={facility.id} initialFavorited={isFavorited} />
          </div>
          <p className="mt-1 text-brand-text-muted">
            {facility.street}, {facility.postalCode} {facility.city}, {facility.state}
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
          {facility.responseTimeBadge && (
            <p className="mt-3 inline-flex items-center gap-1 rounded-brand-full border border-brand-border px-3 py-1 text-xs font-medium text-brand-text-muted">
              <span aria-hidden="true">⏱</span>
              {facility.responseTimeBadge}
            </p>
          )}

          <FacilityGalleryAndMap
            photos={facility.photos}
            latitude={facility.latitude}
            longitude={facility.longitude}
            name={facility.name}
          />

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

          <FacilityNeighborhood latitude={facility.latitude} longitude={facility.longitude} />

          <h2 className="mt-10 text-lg font-semibold text-brand-text">Verfügbarkeit</h2>
          <div className="mt-3 flex flex-col gap-3">
            {facility.capacities.map((capacity) => (
              <div
                key={capacity.id}
                className="rounded-brand-md border border-brand-border px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-brand-text">{bookingTypeLabels[capacity.bookingType]}</span>
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
                    ? `${formatPriceEuro(capacity.monthlyPriceCents)}/Monat (Heimpreis vor Pflegekassen-Zuschuss)`
                    : "Preis auf Anfrage"}
                </p>

                {capacity.pflegegradPricing.length > 0 && (
                  <PflegekassenZuschussRechner
                    bookingType={capacity.bookingType}
                    pflegegradPricing={capacity.pflegegradPricing}
                  />
                )}

                {capacity.bookingType === "STATIONAERE_AUFNAHME" &&
                  capacity.availableSlots === 0 &&
                  capacity.availableFrom && (
                    <p className="mt-1 text-sm text-brand-text-muted">
                      Nächster freier Platz voraussichtlich ab {formatDate(capacity.availableFrom)}
                    </p>
                  )}

                {capacity.availableSlots === 0 && (
                  <WaitlistRowCTA facilityId={facility.id} bookingType={capacity.bookingType} />
                )}
              </div>
            ))}
          </div>

          {(facility.checkInTime ||
            facility.checkOutTime ||
            facility.visitingHours ||
            facility.wifiInfo ||
            facility.parkingInfo ||
            facility.petsPolicy ||
            facility.cancellationPolicyDays !== null) && (
            <>
              <h2 className="mt-10 text-lg font-semibold text-brand-text">
                Unterkunftsrichtlinien
              </h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {facility.checkInTime && (
                  <div>
                    <dt className="text-sm text-brand-text-muted">Check-in</dt>
                    <dd className="text-brand-text">{facility.checkInTime}</dd>
                  </div>
                )}
                {facility.checkOutTime && (
                  <div>
                    <dt className="text-sm text-brand-text-muted">Check-out</dt>
                    <dd className="text-brand-text">{facility.checkOutTime}</dd>
                  </div>
                )}
                {facility.visitingHours && (
                  <div>
                    <dt className="text-sm text-brand-text-muted">Besuchszeiten</dt>
                    <dd className="text-brand-text">{facility.visitingHours}</dd>
                  </div>
                )}
                {facility.wifiInfo && (
                  <div>
                    <dt className="text-sm text-brand-text-muted">Internetzugang</dt>
                    <dd className="text-brand-text">{facility.wifiInfo}</dd>
                  </div>
                )}
                {facility.parkingInfo && (
                  <div>
                    <dt className="text-sm text-brand-text-muted">Parkmöglichkeiten</dt>
                    <dd className="text-brand-text">{facility.parkingInfo}</dd>
                  </div>
                )}
                {facility.petsPolicy && (
                  <div>
                    <dt className="text-sm text-brand-text-muted">Haustiere</dt>
                    <dd className="text-brand-text">{facility.petsPolicy}</dd>
                  </div>
                )}
                {facility.cancellationPolicyDays !== null && (
                  <div>
                    <dt className="text-sm text-brand-text-muted">Stornierung</dt>
                    <dd className="text-brand-text">
                      Bis {facility.cancellationPolicyDays}{" "}
                      {facility.cancellationPolicyDays === 1 ? "Tag" : "Tage"} vorher kostenlos
                      stornierbar
                    </dd>
                  </div>
                )}
              </dl>
            </>
          )}

          <FacilityReviews
            facilitySlug={facility.slug}
            facilityName={facility.name}
            reviews={facility.reviews}
            avgRating={facility.avgRating}
            reviewCount={facility.reviewCount}
          />

          <p className="mt-10 border-t border-brand-border pt-4 text-sm text-brand-text-muted">
            Verwaltet von {facility.operatorName}
          </p>
        </div>

        <div>
          <BookingSidebar
            facilityId={facility.id}
            slug={slug}
            availableBookingTypes={availableBookingTypes}
            allBookingTypes={allBookingTypes}
          />
        </div>
      </section>
    </main>
  );
}
