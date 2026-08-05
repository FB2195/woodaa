import { Suspense } from "react";
import { Header } from "@/components/Header";
import { EmailChangeConfirmStatus } from "@/components/account/EmailChangeConfirmStatus";

export default function EmailChangeConfirmPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
          <Suspense fallback={<p className="text-brand-text-muted">Lädt…</p>}>
            <EmailChangeConfirmStatus />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
