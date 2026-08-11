"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { establishSession, redirectFor } from "@/lib/authSession";
import { trpc } from "@/lib/trpc";
import type { LoginAudience } from "@woodaa/validators";

type Mode = "login" | "bootstrap-admin";

const copy: Record<Mode, { title: string; submit: string }> = {
  login: { title: "Anmelden", submit: "Anmelden" },
  "bootstrap-admin": {
    title: "Admin-Konto einrichten",
    submit: "Admin-Konto erstellen",
  },
};

export function AuthForm({ mode, audience }: { mode: Mode; audience?: LoginAudience }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation();
  const bootstrapAdmin = trpc.auth.bootstrapAdmin.useMutation();
  const verifyTwoFactor = trpc.auth.verifyTwoFactor.useMutation();
  const pending = login.isPending || bootstrapAdmin.isPending || verifyTwoFactor.isPending;

  if (challengeToken) {
    return (
      <form
        className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);
          const code = String(form.get("code") ?? "").trim();

          try {
            const result = await verifyTwoFactor.mutateAsync({ challengeToken, code });
            await establishSession(result);
            await utils.invalidate();
            router.push(redirectFor(result.user.role));
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
          }
        }}
      >
        <h1 className="text-lg font-semibold text-brand-heading">Bestätigungscode</h1>
        <p className="text-sm text-brand-text-muted">
          Gib den 6-stelligen Code aus deiner Authenticator-App ein, oder verwende einen deiner
          Wiederherstellungscodes.
        </p>
        <label className="flex flex-col gap-1 text-sm text-brand-text">
          Code
          <input
            name="code"
            required
            autoFocus
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Einen Moment…" : "Bestätigen"}
        </button>
      </form>
    );
  }

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
            const result = await login.mutateAsync({ email, password, audience });
            if (result.twoFactorRequired) {
              setChallengeToken(result.challengeToken);
              return;
            }
            await establishSession(result);
            await utils.invalidate();
            router.push(redirectFor(result.user.role));
            router.refresh();
            return;
          }

          const name = String(form.get("name") ?? "");
          const result = await bootstrapAdmin.mutateAsync({ name, email, password });
          await establishSession(result);
          await utils.invalidate();
          router.push(redirectFor(result.user.role));
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
        }
      }}
    >
      <h1 className="text-lg font-semibold text-brand-heading">{copy[mode].title}</h1>

      {mode === "bootstrap-admin" && (
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

      {mode === "login" && (
        <Link
          href="/passwort-vergessen"
          className="-mt-2 self-end text-sm text-brand-accent underline"
        >
          Passwort vergessen?
        </Link>
      )}

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
