"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const verifyEmail = trpc.auth.verifyEmail.useMutation();
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    verifyEmail.mutate(
      { token },
      {
        onError: (err) => setError(err.message),
      },
    );
  }, [token]);

  if (!token) {
    return (
      <p className="text-brand-text-muted">
        Kein Bestätigungslink gefunden. Bitte den Link aus der E-Mail
        verwenden.
      </p>
    );
  }

  if (verifyEmail.isPending || !verifyEmail.isSuccess) {
    if (error) {
      return <p className="text-red-600">{error}</p>;
    }
    return <p className="text-brand-text-muted">Bestätige E-Mail-Adresse…</p>;
  }

  return (
    <div>
      <p className="font-semibold text-brand-heading">
        E-Mail-Adresse bestätigt!
      </p>
      <p className="mt-2 text-sm text-brand-text-muted">
        {verifyEmail.data.email} ist jetzt verifiziert. Du kannst dieses
        Fenster schließen oder zum Dashboard zurückkehren.
      </p>
    </div>
  );
}
