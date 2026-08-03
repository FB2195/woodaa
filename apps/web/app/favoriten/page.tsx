import Link from "next/link";
import { FacilityCard } from "@/components/FacilityCard";
import { Header } from "@/components/Header";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function FavoritesPage() {
  const trpcServer = await getTrpcServer();
  const facilities = await trpcServer.favorite.list();

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-primary-dark">
          Meine Favoriten
        </h1>

        {facilities.length === 0 ? (
          <p className="mt-10 rounded-brand-lg border border-brand-border bg-brand-surface p-8 text-center text-brand-text-muted">
            Noch keine Favoriten gespeichert.{" "}
            <Link href="/suche" className="text-brand-accent hover:underline">
              Jetzt Einrichtungen durchsuchen
            </Link>
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} initialFavorited />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
