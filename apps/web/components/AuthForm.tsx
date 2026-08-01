"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Mode = "login" | "register-suchende" | "register-betreiber";

const copy: Record<Mode, { title: string; submit: string }> = {
  login: { title: "Anmelden", submit: "Anmelden" },
  "register-suchende": {
    title: "Konto erstellen",
    submit: "Konto erstellen",
  },
  "register-betreiber": {
    title: "Einrichtung eintragen",
    submit: "Als Einrichtung registrieren",
  },
};

async function establishSession(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokens),
  });
  if (!res.ok) {
    throw new Error("Sitzung konnte nicht gestartet werden.");
  }
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation();
  const register = trpc.auth.register.useMutation();
  const pending = login.isPending || register.isPending;

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") ?? "");
        const password = String(form.get("password") ?? "");

        try {
          if (mode === "login") {
            const result = await login.mutateAsync({ email, password });
            await establishSession(result);
            router.push(
              result.user.role === "BETREIBER" ? "/betreiber/dashboard" : "/",
            );
            router.refresh();
            return;
          }

          const name = String(form.get("name") ?? "");
          const role = mode === "register-betreiber" ? "BETREIBER" : "SUCHENDE";
          const result = await register.mutateAsync({ name, email, password, role });
          await establishSession(result);
          router.push(role === "BETREIBER" ? "/betreiber/dashboard" : "/");
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.",
          );
        }
      }}
    >
      <h1 className="text-lg font-semibold text-brand-primary-dark">
        {copy[mode].title}
      </h1>

      {mode !== "login" && (
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Name
          <input
            name="name"
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        E-Mail
        <input
          type="email"
          name="email"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Passwort
        <input
          type="password"
          name="password"
          required
          minLength={mode === "login" ? undefined : 8}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Einen Moment…" : copy[mode].submit}
      </button>
    </form>
  );
}
