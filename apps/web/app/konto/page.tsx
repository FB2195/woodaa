import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";
import { ExportDataButton } from "@/components/account/ExportDataButton";
import { Header } from "@/components/Header";
import { getTrpcServer } from "@/lib/trpc-server";

const roleLabels: Record<"SUCHENDE" | "BETREIBER" | "ADMIN", string> = {
  SUCHENDE: "Suchende",
  BETREIBER: "Pflegeeinrichtung",
  ADMIN: "Admin",
};

export default async function AccountPage() {
  const trpcServer = await getTrpcServer();
  const me = await trpcServer.auth.me();

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-primary-dark">Mein Konto</h1>

        <div className="mt-6 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-text-muted">Name</dt>
              <dd className="text-brand-text">{me.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-text-muted">E-Mail</dt>
              <dd className="text-brand-text">{me.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-text-muted">Rolle</dt>
              <dd className="text-brand-text">{roleLabels[me.role]}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-brand-text">Meine Daten</h2>
          <p className="mt-1 text-sm text-brand-text-muted">
            Lade eine Kopie aller Daten herunter, die wir über dich gespeichert
            haben.
          </p>
          <div className="mt-3">
            <ExportDataButton />
          </div>
        </div>

        {me.role !== "ADMIN" && (
          <div className="mt-10 border-t border-brand-border pt-8">
            <h2 className="text-lg font-semibold text-brand-text">Konto löschen</h2>
            <p className="mt-1 text-sm text-brand-text-muted">
              Löscht dein Konto und alle zugehörigen Daten endgültig.
            </p>
            <div className="mt-3">
              <DeleteAccountForm />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
