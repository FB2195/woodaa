import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";

export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-xs text-brand-text-muted">
          Betreibst du eine Pflegeeinrichtung?{" "}
          <Link href="/betreiber/login" className="text-brand-accent underline">
            Zum Betreiber-Login
          </Link>
        </p>
      </section>
    </main>
  );
}
