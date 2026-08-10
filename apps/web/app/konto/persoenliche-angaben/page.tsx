import { AccountDetailsForm } from "@/components/account/AccountDetailsForm";
import { SensitivePersonalData } from "@/components/account/SensitivePersonalData";
import { SubPageHeader } from "@/components/account/SubPageHeader";
import { Header } from "@/components/Header";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function PersoenlicheAngabenPage() {
  const trpcServer = await getTrpcServer();
  const me = await trpcServer.auth.me();

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <SubPageHeader title="Persönliche Angaben" />
        <AccountDetailsForm name={me.name} email={me.email} role={me.role} />
        {me.role === "SUCHENDE" && <SensitivePersonalData />}
      </section>
    </main>
  );
}
