"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function DeleteAccountForm() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteAccount = trpc.account.deleteAccount.useMutation();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    try {
      await deleteAccount.mutateAsync({ password });
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-brand-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        Konto löschen
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-brand-lg border border-red-300 bg-red-50 p-4"
    >
      <p className="text-sm font-semibold text-red-700">
        Das kann nicht rückgängig gemacht werden. Alle deine Daten werden
        endgültig gelöscht.
      </p>
      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Passwort zur Bestätigung
        <input
          type="password"
          name="password"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={deleteAccount.isPending}
          className="rounded-brand-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {deleteAccount.isPending ? "Wird gelöscht…" : "Endgültig löschen"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-brand-md px-4 py-2 text-sm text-brand-text-muted hover:text-brand-text"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
