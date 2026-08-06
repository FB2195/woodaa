import { AccountDetailsForm } from "@/components/account/AccountDetailsForm";
import { CareApplicationsSection } from "@/components/account/CareApplicationsSection";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";
import { ExportDataButton } from "@/components/account/ExportDataButton";
import { MyBookingsSection } from "@/components/account/MyBookingsSection";
import { VollmachtSection } from "@/components/account/VollmachtSection";
import { Header } from "@/components/Header";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function AccountPage() {
  const trpcServer = await getTrpcServer();
  const me = await trpcServer.auth.me();

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">Mein Konto</h1>

        <AccountDetailsForm name={me.name} email={me.email} role={me.role} />

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
          <div className="mt-8">
            <TwoFactorSetup enabled={me.twoFactorEnabled} />
          </div>
        )}

        {me.role === "SUCHENDE" && (
          <>
            <MyBookingsSection />
            <CareApplicationsSection />
            <VollmachtSection />
          </>
        )}

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
