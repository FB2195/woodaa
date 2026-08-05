"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const utils = trpc.useUtils();
  const [step, setStep] = useState<"idle" | "setup" | "recovery-codes">("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const setupInitiate = trpc.twoFactor.setupInitiate.useMutation({
    onSuccess: (result) => {
      setQrDataUrl(result.qrDataUrl);
      setSecret(result.secret);
      setStep("setup");
    },
  });
  const setupConfirm = trpc.twoFactor.setupConfirm.useMutation({
    onSuccess: (result) => {
      setRecoveryCodes(result.recoveryCodes);
      setStep("recovery-codes");
      utils.auth.me.invalidate();
    },
    onError: (err) => setError(err.message),
  });
  const disable = trpc.twoFactor.disable.useMutation({
    onSuccess: () => {
      setStep("idle");
      utils.auth.me.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  if (enabled && step === "idle") {
    return (
      <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="text-lg font-semibold text-brand-heading">
          Zwei-Faktor-Authentifizierung
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          2FA ist für dieses Konto aktiv.
        </p>
        <form
          className="mt-4 flex items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            const form = new FormData(event.currentTarget);
            disable.mutate({ code: String(form.get("code") ?? "") });
          }}
        >
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Code zum Deaktivieren
            <input
              name="code"
              required
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <button
            type="submit"
            disabled={disable.isPending}
            className="rounded-brand-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Deaktivieren
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (step === "recovery-codes") {
    return (
      <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="text-lg font-semibold text-brand-heading">
          2FA ist jetzt aktiv
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          Speichere diese Wiederherstellungscodes jetzt an einem sicheren Ort
          — jeder Code funktioniert nur einmal und wird nicht erneut
          angezeigt.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-brand-md bg-brand-bg p-4 font-mono text-sm">
          {recoveryCodes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setStep("idle")}
          className="mt-4 rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Codes gesichert
        </button>
      </div>
    );
  }

  if (step === "setup" && qrDataUrl && secret) {
    return (
      <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="text-lg font-semibold text-brand-heading">
          2FA einrichten
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          Scanne den QR-Code mit einer Authenticator-App (z. B. Google
          Authenticator, Authy) oder gib den Code manuell ein:{" "}
          <span className="font-mono">{secret}</span>
        </p>
        {/* Data-URI from our own server (qrcode package), not a remote image */}
        <img src={qrDataUrl} alt="QR-Code für die Authenticator-App" className="mt-4 h-40 w-40" />
        <form
          className="mt-4 flex items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            const form = new FormData(event.currentTarget);
            setupConfirm.mutate({ code: String(form.get("code") ?? "") });
          }}
        >
          <label className="flex flex-col gap-1 text-sm text-brand-text">
            Bestätigungscode
            <input
              name="code"
              required
              autoFocus
              className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <button
            type="submit"
            disabled={setupConfirm.isPending}
            className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Bestätigen
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <h2 className="text-lg font-semibold text-brand-heading">
        Zwei-Faktor-Authentifizierung
      </h2>
      <p className="mt-1 text-sm text-brand-text-muted">
        2FA ist für dieses Konto noch nicht aktiv. Empfohlen für Admin-Konten.
      </p>
      <button
        type="button"
        onClick={() => setupInitiate.mutate()}
        disabled={setupInitiate.isPending}
        className="mt-4 rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {setupInitiate.isPending ? "Einen Moment…" : "2FA einrichten"}
      </button>
    </div>
  );
}
