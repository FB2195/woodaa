"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

// business.woodaa.de's own header - deliberately NOT the consumer <Header/>
// (no search, favorites, language switcher, login menu). Facility
// operators should recognize this as a distinct, exclusive environment,
// not the same site as woodaa.de with a dashboard bolted on.
export function OperatorHeader() {
  const router = useRouter();
  const utils = trpc.useUtils();

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    await utils.auth.me.reset();
    await utils.invalidate();
    router.push("/betreiber/login");
    router.refresh();
  }

  return (
    <header className="border-b border-brand-border bg-brand-heading">
      <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/betreiber/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="woodaa"
            width={478}
            height={142}
            priority
            className="h-6 w-auto brightness-0 invert sm:h-7"
          />
          <span className="hidden rounded-brand-full border border-white/30 px-2.5 py-0.5 text-xs font-medium text-white/90 sm:inline-block">
            Für Pflegeeinrichtungen
          </span>
        </Link>
        <button
          type="button"
          onClick={logout}
          className="rounded-brand-md px-3 py-2 text-sm font-medium text-white/80 transition hover:text-white active:bg-white/10"
        >
          Abmelden
        </button>
      </div>
    </header>
  );
}
