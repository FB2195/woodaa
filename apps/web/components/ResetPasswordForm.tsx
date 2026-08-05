"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [mismatch, setMismatch] = useState(false);
  const resetPassword = trpc.auth.resetPassword.useMutation();

  if (!token) {
    return (
      <p className="text-brand-text-muted">
        Kein gültiger Link gefunden. Bitte fordere über{" "}
        <Link href="/passwort-vergessen" className="text-brand-accent underline">
          Passwort vergessen
        </Link>{" "}
        einen neuen Link an.
      </p>
    );
  }

  if (resetPassword.isSuccess) {
    return (
      <div className="rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
        <p className="font-semibold text-brand-heading">
          Passwort geändert!
        </p>
        <p className="mt-1 text-sm text-brand-text-muted">
          Du kannst dich jetzt mit deinem neuen Passwort anmelden.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setMismatch(false);
        const form = new FormData(event.currentTarget);
        const password = String(form.get("password") ?? "");
        const confirmPassword = String(form.get("confirmPassword") ?? "");
        if (password !== confirmPassword) {
          setMismatch(true);
          return;
        }
        resetPassword.mutate({ token, password });
      }}
    >
      <h1 className="text-lg font-semibold text-brand-heading">
        Neues Passwort setzen
      </h1>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Neues Passwort
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Neues Passwort bestätigen
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      {mismatch && (
        <p className="text-sm text-red-600">
          Die Passwörter stimmen nicht überein.
        </p>
      )}
      {resetPassword.isError && (
        <p className="text-sm text-red-600">{resetPassword.error.message}</p>
      )}

      <button
        type="submit"
        disabled={resetPassword.isPending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {resetPassword.isPending ? "Wird gespeichert…" : "Passwort speichern"}
      </button>
    </form>
  );
}
