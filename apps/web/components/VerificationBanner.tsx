"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function VerificationBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const resend = trpc.auth.resendVerificationEmail.useMutation({
    onSuccess: () => setSent(true),
  });

  return (
    <div className="rounded-brand-lg border border-brand-accent/40 bg-brand-accent/10 p-6">
      <p className="font-semibold text-brand-heading">
        Bitte bestätige deine E-Mail-Adresse
      </p>
      <p className="mt-1 text-sm text-brand-text-muted">
        Wir haben einen Bestätigungslink an {email} geschickt. Du kannst das
        Tool schon nutzen - bestätigt sein musst du erst, wenn du öffentlich
        auf woodaa sichtbar werden willst.
      </p>
      <button
        type="button"
        disabled={resend.isPending || sent}
        onClick={() => resend.mutate()}
        className="mt-3 rounded-brand-md border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent transition hover:bg-brand-accent hover:text-white disabled:opacity-50"
      >
        {sent
          ? "E-Mail erneut gesendet"
          : resend.isPending
            ? "Wird gesendet…"
            : "E-Mail erneut senden"}
      </button>
    </div>
  );
}
