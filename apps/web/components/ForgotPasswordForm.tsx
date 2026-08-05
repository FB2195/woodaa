"use client";

import { trpc } from "@/lib/trpc";

export function ForgotPasswordForm() {
  const forgotPassword = trpc.auth.forgotPassword.useMutation();

  if (forgotPassword.isSuccess) {
    return (
      <div className="rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
        <p className="font-semibold text-brand-heading">
          E-Mail unterwegs
        </p>
        <p className="mt-1 text-sm text-brand-text-muted">
          Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir
          einen Link zum Zurücksetzen des Passworts geschickt. Der Link ist
          1 Stunde gültig.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        forgotPassword.mutate({ email: String(form.get("email") ?? "") });
      }}
    >
      <h1 className="text-lg font-semibold text-brand-heading">
        Passwort vergessen
      </h1>
      <p className="text-sm text-brand-text-muted">
        Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem
        du ein neues Passwort setzen kannst.
      </p>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        E-Mail
        <input
          type="email"
          name="email"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      {forgotPassword.isError && (
        <p className="text-sm text-red-600">{forgotPassword.error.message}</p>
      )}

      <button
        type="submit"
        disabled={forgotPassword.isPending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {forgotPassword.isPending ? "Wird gesendet…" : "Link anfordern"}
      </button>
    </form>
  );
}
