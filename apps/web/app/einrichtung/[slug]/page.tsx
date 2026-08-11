import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { BookingSidebar } from "@/components/BookingSidebar";
import { FacilityAmenities } from "@/components/FacilityAmenities";
import { FacilityAvailability } from "@/components/FacilityAvailability";
import { FacilityDescription } from "@/components/FacilityDescription";
import { FacilityGalleryAndMap } from "@/components/FacilityGalleryAndMap";
import { FacilityHighlights } from "@/components/FacilityHighlights";
import { FacilityNeighborhood } from "@/components/FacilityNeighborhood";
import { FacilityPolicyLinks } from "@/components/FacilityPolicyLinks";
import { FacilityReviews } from "@/components/FacilityReviews";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Header } from "@/components/Header";
import { MobileBookingBar } from "@/components/MobileBookingBar";
import { StarRating } from "@/components/StarRating";
import { VerifiedBadge } from "@/components/VerifiedBadge";
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
  const favoriteIds = await trpcServer.favorite.myFacilityIds().catch((): string[] => []);
  const isFavorited = favoriteIds.includes(facility.id);

  const availableBookingTypes = facility.capacities
    .filter((capacity) => capacity.availableSlots > 0)
    .map((capacity) => capacity.bookingType);
  const allBookingTypes = facility.capacities.map((capacity) => capacity.bookingType);

  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 pb-24 lg:grid-cols-3 lg:pb-12">
        <div className="min-w-0 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-brand-heading">{facility.name}</h1>
              {facility.verifiedAt && <VerifiedBadge />}
            </div>
            <FavoriteButton facilityId={facility.id} initialFavorited={isFavorited} />
          </div>

          {facility.reviewCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={facility.avgRating ?? 0} size="sm" />
              <span className="text-sm font-semibold text-brand-heading">
                {facility.avgRating!.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
              </span>
              <span className="text-sm text-brand-text-muted">
                ({facility.reviewCount}{" "}
                {facility.reviewCount === 1 ? "Bewertung" : "Bewertungen"})
              </span>
            </div>
          )}

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

          <FacilityHighlights amenities={facility.amenities} />

          <FacilityReviews
            facilitySlug={facility.slug}
            facilityName={facility.name}
            reviews={facility.reviews}
            avgRating={facility.avgRating}
            reviewCount={facility.reviewCount}
          />

          <FacilityNeighborhood latitude={facility.latitude} longitude={facility.longitude} />

          <FacilityAmenities amenities={facility.amenities} />

          <FacilityAvailability facilityId={facility.id} capacities={facility.capacities} />

          <FacilityDescription description={facility.description} />

          <FacilityPolicyLinks
            name={facility.name}
            checkInTime={facility.checkInTime}
            checkOutTime={facility.checkOutTime}
            visitingHours={facility.visitingHours}
            wifiInfo={facility.wifiInfo}
            parkingInfo={facility.parkingInfo}
            petsPolicy={facility.petsPolicy}
            cancellationPolicyDays={facility.cancellationPolicyDays}
          />

          <p className="mt-10 border-t border-brand-border pt-4 text-sm text-brand-text-muted">
            Verwaltet von {facility.operatorName}
          </p>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <BookingSidebar
            facilityId={facility.id}
            slug={slug}
            availableBookingTypes={availableBookingTypes}
            allBookingTypes={allBookingTypes}
          />
        </div>
      </section>

      <MobileBookingBar />
    </main>
  );
}
