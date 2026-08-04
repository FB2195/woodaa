import { Suspense } from "react";
import { Header } from "@/components/Header";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <Suspense fallback={<p className="text-brand-text-muted">Lädt…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
