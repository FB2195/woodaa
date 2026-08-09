"use client";

import { useParams } from "next/navigation";
import { BookingDetailView } from "@/components/account/BookingDetailView";
import { Header } from "@/components/Header";
import { trpc } from "@/lib/trpc";

export default function BuchungDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = trpc.booking.myBookings.useQuery();
  const booking = data?.find((b) => b.id === id);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        {isLoading ? (
          <p className="text-sm text-brand-text-muted">Lädt…</p>
        ) : booking ? (
          <BookingDetailView booking={booking} />
        ) : (
          <p className="text-sm text-brand-text-muted">Diese Buchung wurde nicht gefunden.</p>
        )}
      </section>
    </main>
  );
}
