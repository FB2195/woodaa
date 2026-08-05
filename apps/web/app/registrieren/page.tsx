import Link from "next/link";
import { Header } from "@/components/Header";
import { RegisterSuchendeForm } from "@/components/RegisterSuchendeForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <RegisterSuchendeForm />
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
