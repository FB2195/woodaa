import { redirect } from "next/navigation";
import { SubPageHeader } from "@/components/account/SubPageHeader";
import { MyBookingsSection } from "@/components/account/MyBookingsSection";
import { Header } from "@/components/Header";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function BuchungenPage() {
  const trpcServer = await getTrpcServer();
  const me = await trpcServer.auth.me();
  if (me.role !== "SUCHENDE") redirect("/konto");

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <SubPageHeader title="Meine Buchungen" />
        <MyBookingsSection />
      </section>
    </main>
  );
}
