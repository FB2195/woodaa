import { AccountMenu } from "@/components/account/AccountMenu";
import { Header } from "@/components/Header";
import { getServerTranslations } from "@/lib/i18n/server";
import { getTrpcServer } from "@/lib/trpc-server";

export default async function AccountPage() {
  const trpcServer = await getTrpcServer();
  const me = await trpcServer.auth.me();
  const t = await getServerTranslations("account");

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">
          {t("greeting", { name: me.name })}
        </h1>
        <p className="mt-1 text-sm text-brand-text-muted">{me.email}</p>

        <AccountMenu role={me.role} />
      </section>
    </main>
  );
}
