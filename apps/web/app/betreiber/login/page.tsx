import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";

// Separate entry point from the generic /login for facility operators, so
// their login doesn't sit behind a page that reads as the consumer/family
// login - same AuthForm and auth.login mutation underneath (the post-login
// redirect is already role-aware), just a distinctly branded landing spot.
export default function OperatorLoginPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <p className="mb-1 text-center text-sm font-medium text-brand-accent">
          Für Pflegeeinrichtungen
        </p>
        <h1 className="mb-6 text-center text-2xl font-bold text-brand-heading">
          Betreiber-Login
        </h1>
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-xs text-brand-text-muted">
          Noch keinen Zugang?{" "}
          <Link href="/betreiber/registrieren" className="text-brand-accent underline">
            Kostenlos registrieren
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-brand-text-muted">
          Du suchst einen Pflegeplatz?{" "}
          <Link href="/login" className="text-brand-accent underline">
            Zum normalen Login
          </Link>
        </p>
      </section>
    </main>
  );
}
