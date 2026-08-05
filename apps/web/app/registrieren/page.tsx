import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";

export default function RegisterPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <AuthForm mode="register-suchende" />
        <p className="mt-4 text-center text-xs text-brand-text-muted">
          Schon dabei?{" "}
          <Link href="/login" className="text-brand-accent underline">
            Anmelden
          </Link>
        </p>
      </section>
    </main>
  );
}
