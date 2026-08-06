import { redirect } from "next/navigation";
import { SubPageHeader } from "@/components/account/SubPageHeader";
import { Header } from "@/components/Header";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function SicherheitPage() {
  const trpcServer = await getTrpcServer();
  const me = await trpcServer.auth.me();
  if (me.role === "ADMIN") redirect("/konto");

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <SubPageHeader title="Sicherheitseinstellungen" />
        <TwoFactorSetup enabled={me.twoFactorEnabled} />
      </section>
    </main>
  );
}
