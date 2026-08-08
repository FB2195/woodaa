import Link from "next/link";
import { CompareView } from "@/components/compare/CompareView";
import { Header } from "@/components/Header";
import { getTrpcServer } from "@/lib/trpc-server";
import { MAX_COMPARE } from "@/lib/compare";

type ComparePageProps = {
  searchParams: Promise<{ ids?: string }>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { ids: idsParam } = await searchParams;
  // De-duped, capped at MAX_COMPARE, same limit the CompareToggle/CompareBar
  // already enforce client-side - re-enforced here too since this URL is
  // shareable/bookmarkable, not just reached via the compare tray.
  const ids = idsParam
    ? Array.from(
        new Set(
          idsParam
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      ).slice(0, MAX_COMPARE)
    : [];

  const trpcServer = await getTrpcServer();
  const facilities = ids.length ? await trpcServer.facility.byIds({ ids }) : [];

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">Einrichtungen vergleichen</h1>

        {facilities.length === 0 ? (
          <p className="mt-6 rounded-brand-lg border border-brand-border bg-brand-surface p-8 text-center text-brand-text-muted">
            Keine Einrichtungen ausgewählt.{" "}
            <Link href="/suche" className="text-brand-accent hover:underline">
              Jetzt Einrichtungen durchsuchen
            </Link>{" "}
            und über „Vergleichen" bis zu {MAX_COMPARE} Einrichtungen auswählen.
          </p>
        ) : (
          <CompareView facilities={facilities} />
        )}
      </section>
    </main>
  );
}
