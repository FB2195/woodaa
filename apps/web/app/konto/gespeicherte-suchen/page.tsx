import { redirect } from "next/navigation";
import { SubPageHeader } from "@/components/account/SubPageHeader";
import { SavedSearchesSection } from "@/components/account/SavedSearchesSection";
import { Header } from "@/components/Header";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function GespeicherteSuchenPage() {
  const trpcServer = await getTrpcServer();
  const me = await trpcServer.auth.me();
  if (me.role !== "SUCHENDE") redirect("/konto");

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <SubPageHeader title="Gespeicherte Suchen" />
        <SavedSearchesSection />
      </section>
    </main>
  );
}
