import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

// Deliberately its own minimal layout, not the shared consumer <Header/> -
// business.woodaa.de is meant to read as its own, exclusive environment for
// facility operators, not the same site as woodaa.de with a different form
// bolted on. Nothing here except how to get in: register, log in, or reset
// a password. auth.login's audience="operator" check (see auth.ts) is the
// actual enforcement - a SUCHENDE/ADMIN account is rejected server-side
// even with a correct password, not just kept off this page.
export default function OperatorLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-heading px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/betreiber/login" className="mb-8 flex justify-center">
          <Image
            src="/logo.png"
            alt="woodaa"
            width={478}
            height={142}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <div className="rounded-brand-lg bg-brand-surface p-8 shadow-lg">
          <p className="mb-1 text-center text-sm font-medium text-brand-accent">
            Für Pflegeeinrichtungen
          </p>
          <h1 className="mb-6 text-center text-2xl font-bold text-brand-heading">
            Betreiber-Login
          </h1>
          <AuthForm mode="login" audience="operator" />
          <p className="mt-4 text-center text-xs text-brand-text-muted">
            Noch keinen Zugang?{" "}
            <Link href="/betreiber/registrieren" className="text-brand-accent underline">
              Kostenlos registrieren
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/70">
          Du suchst einen Pflegeplatz?{" "}
          <Link href="https://woodaa.de/login" className="underline hover:text-white">
            Zum normalen Login
          </Link>
        </p>
      </div>
    </main>
  );
}
