"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const roleLabels: Record<"SUCHENDE" | "BETREIBER" | "MITARBEITER" | "ADMIN", string> = {
  SUCHENDE: "Suchende",
  BETREIBER: "Pflegeeinrichtung",
  MITARBEITER: "Team-Mitglied",
  ADMIN: "Admin",
};

export function AccountDetailsForm({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: "SUCHENDE" | "BETREIBER" | "MITARBEITER" | "ADMIN";
}) {
  const router = useRouter();
  const [nameValue, setNameValue] = useState(name);
  const [nameError, setNameError] = useState<string | null>(null);
  const updateName = trpc.auth.updateName.useMutation();

  const [emailFormOpen, setEmailFormOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const requestEmailChange = trpc.auth.requestEmailChange.useMutation();

  return (
    <div className="mt-6 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <form
        className="flex items-end gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setNameError(null);
          try {
            await updateName.mutateAsync({ name: nameValue.trim() });
            router.refresh();
          } catch (err) {
            setNameError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
          }
        }}
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-brand-text">
          Name
          <input
            value={nameValue}
            onChange={(event) => setNameValue(event.target.value)}
            required
            className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <button
          type="submit"
          disabled={updateName.isPending || nameValue.trim() === name}
          className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {updateName.isPending ? "Wird gespeichert…" : "Speichern"}
        </button>
      </form>
      {nameError && <p className="mt-2 text-sm text-red-600">{nameError}</p>}

      <div className="mt-5 flex justify-between border-t border-brand-border pt-5">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-brand-text-muted">E-Mail</span>
            <span className="text-brand-text">{email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-brand-text-muted">Rolle</span>
            <span className="text-brand-text">{roleLabels[role]}</span>
          </div>
        </div>
      </div>

      {!emailFormOpen ? (
        <button
          type="button"
          onClick={() => setEmailFormOpen(true)}
          className="mt-3 text-sm font-medium text-brand-accent underline"
        >
          E-Mail-Adresse ändern
        </button>
      ) : requestEmailChange.isSuccess ? (
        <p className="mt-3 text-sm text-brand-text-muted">
          Wir haben eine Bestätigungs-E-Mail an {email} geschickt. Bitte bestätige dort die Änderung
          - danach schicken wir eine zweite Bestätigung an die neue Adresse.
        </p>
      ) : (
        <form
          className="mt-3 flex items-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setEmailError(null);
            const form = new FormData(event.currentTarget);
            const newEmail = String(form.get("newEmail") ?? "").trim();
            try {
              await requestEmailChange.mutateAsync({ newEmail });
            } catch (err) {
              setEmailError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
            }
          }}
        >
          <label className="flex flex-1 flex-col gap-1 text-sm text-brand-text">
            Neue E-Mail-Adresse
            <input
              name="newEmail"
              type="email"
              required
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <button
            type="submit"
            disabled={requestEmailChange.isPending}
            className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {requestEmailChange.isPending ? "Wird gesendet…" : "Anfordern"}
          </button>
        </form>
      )}
      {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
    </div>
  );
}
