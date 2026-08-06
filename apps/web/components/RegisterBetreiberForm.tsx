"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { establishSession, redirectFor } from "@/lib/authSession";
import { trpc } from "@/lib/trpc";

export function RegisterBetreiberForm() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);
  const register = trpc.auth.register.useMutation();

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const get = (name: string) => String(form.get(name) ?? "").trim();

        try {
          const result = await register.mutateAsync({
            role: "BETREIBER",
            name: get("name"),
            email: get("email"),
            password: get("password"),
            facilityName: get("facilityName"),
            street: get("street"),
            postalCode: get("postalCode"),
            city: get("city"),
            state: get("state"),
            operatorPhone: get("operatorPhone"),
            operatorPhoneDurchwahl: get("operatorPhoneDurchwahl") || undefined,
            agbAccepted: true,
          });
          await establishSession(result);
          await utils.invalidate();
          router.push(redirectFor(result.user.role));
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
        }
      }}
    >
      <h1 className="text-lg font-semibold text-brand-heading">Kostenlos starten</h1>

      <div className="border-b border-brand-border pb-1">
        <p className="text-sm font-medium text-brand-text">Einrichtung</p>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Name der Einrichtung
        <input
          name="facilityName"
          required
          placeholder="z. B. Seniorenzentrum Am Park"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Straße & Hausnummer
        <input
          name="street"
          autoComplete="street-address"
          required
          placeholder="Musterstraße 12"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          PLZ
          <input
            name="postalCode"
            autoComplete="postal-code"
            required
            placeholder="12345"
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Ort
          <input
            name="city"
            autoComplete="address-level2"
            required
            placeholder="Musterstadt"
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Bundesland
        <input
          name="state"
          autoComplete="address-level1"
          required
          placeholder="Nordrhein-Westfalen"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <div className="border-b border-brand-border pb-1 pt-3">
        <p className="text-sm font-medium text-brand-text">Ansprechpartner & Zugang</p>
      </div>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Name des Ansprechpartners
        <input
          name="name"
          autoComplete="name"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Telefonnummer der Einrichtung
        <input
          type="tel"
          name="operatorPhone"
          autoComplete="tel"
          required
          placeholder="030 12345678"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Durchwahl des Ansprechpartners (optional)
        <input
          type="tel"
          name="operatorPhoneDurchwahl"
          placeholder="-42"
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        E-Mail
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Passwort
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex items-center gap-2 border-t border-brand-border pt-4 text-sm text-brand-text">
        <input type="checkbox" name="agb" required />
        Ich akzeptiere die{" "}
        <Link href="/nutzungsbedingungen" className="text-brand-accent underline">
          Nutzungsbedingungen
        </Link>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={register.isPending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {register.isPending ? "Einen Moment…" : "Kostenlos loslegen"}
      </button>
    </form>
  );
}
