import Link from "next/link";
import { Header } from "@/components/Header";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function HilfePage() {
  const t = await getServerTranslations("hilfe");
  const tHeader = await getServerTranslations("header");

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-heading">{tHeader("helpSupport")}</h1>
        <p className="mt-2 text-brand-text-muted">{t("introText")}</p>

        <div className="mt-8 flex flex-col gap-4">
          <Link
            href="/hilfe/kundenservice"
            className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 transition hover:border-brand-accent"
          >
            <h2 className="font-semibold text-brand-heading">{tHeader("customerService")}</h2>
            <p className="mt-1 text-sm text-brand-text-muted">{t("customerServiceCardText")}</p>
          </Link>

          <Link
            href="/fehler-melden"
            className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 transition hover:border-brand-accent"
          >
            <h2 className="font-semibold text-brand-heading">{tHeader("reportIssue")}</h2>
            <p className="mt-1 text-sm text-brand-text-muted">{t("reportIssueCardText")}</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
