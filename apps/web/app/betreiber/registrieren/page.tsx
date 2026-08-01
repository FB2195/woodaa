import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";

export default function OperatorRegisterPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <p className="mb-6 text-sm text-brand-text-muted">
          Als Pflegeeinrichtung registrieren, um deine Einrichtung auf Woodaa
          einzutragen und Verfügbarkeit selbst zu pflegen.
        </p>
        <AuthForm mode="register-betreiber" />
      </section>
    </main>
  );
}
