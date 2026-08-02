import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";

export default function BootstrapAdminPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <p className="mb-6 text-sm text-brand-text-muted">
          Funktioniert nur einmal: sobald ein Admin-Konto existiert, ist diese
          Seite gesperrt.
        </p>
        <AuthForm mode="bootstrap-admin" />
      </section>
    </main>
  );
}
