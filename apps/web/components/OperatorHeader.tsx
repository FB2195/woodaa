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
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/betreiber/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="woodaa"
            width={478}
            height={142}
            priority
            className="h-7 w-auto brightness-0 invert"
          />
          <span className="rounded-brand-full border border-white/30 px-2.5 py-0.5 text-xs font-medium text-white/90">
            Für Pflegeeinrichtungen
          </span>
        </Link>
        <button
          type="button"
          onClick={logout}
          className="text-sm font-medium text-white/80 transition hover:text-white"
        >
          Abmelden
        </button>
      </div>
    </header>
  );
}
