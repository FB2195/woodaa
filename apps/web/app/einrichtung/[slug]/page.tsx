import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { BookingRequestForm } from "@/components/BookingRequestForm";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { trpcServer } from "@/lib/trpc-server";

type FacilityPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function FacilityPage({ params }: FacilityPageProps) {
  const { slug } = await params;

  const facility = await trpcServer.facility.bySlug({ slug }).catch((err) => {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  });

  const availableBookingTypes = facility.capacities
    .filter((capacity) => capacity.availableSlots > 0)
    .map((capacity) => capacity.bookingType);

  return (
    <main className="min-h-screen">
      <header className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-semibold text-brand-primary-dark">
            Woodaa
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-brand-primary-dark">
            {facility.name}
          </h1>
          <p className="mt-1 text-brand-text-muted">
            {facility.street}, {facility.postalCode} {facility.city},{" "}
            {facility.state}
          </p>

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
          <div className="mt-3 flex flex-col gap-2">
            {facility.capacities.map((capacity) => (
              <div
                key={capacity.id}
                className="flex items-center justify-between rounded-brand-md border border-brand-border px-4 py-3"
              >
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
            ))}
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
