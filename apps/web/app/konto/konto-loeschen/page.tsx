import { redirect } from "next/navigation";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";
import { SubPageHeader } from "@/components/account/SubPageHeader";
import { Header } from "@/components/Header";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function KontoLoeschenPage() {
  const trpcServer = await getTrpcServer();
  const me = await trpcServer.auth.me();
  if (me.role === "ADMIN") redirect("/konto");

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <SubPageHeader title="Konto löschen" />
        <p className="text-sm text-brand-text-muted">
          Löscht dein Konto und alle zugehörigen Daten endgültig.
        </p>
        <div className="mt-4">
          <DeleteAccountForm />
        </div>
      </section>
    </main>
  );
}
