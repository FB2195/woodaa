"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

export function EmailChangeConfirmStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const step = searchParams.get("step");
  const confirmOld = trpc.auth.confirmOldEmailChange.useMutation();
  const confirmNew = trpc.auth.confirmNewEmailChange.useMutation();
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  const mutation = step === "new" ? confirmNew : confirmOld;

  useEffect(() => {
    if (!token || (step !== "old" && step !== "new") || attempted.current) return;
    attempted.current = true;
    mutation.mutate(
      { token },
      { onError: (err) => setError(err.message) },
    );
  }, [token, step]);

  if (!token || (step !== "old" && step !== "new")) {
    return (
      <p className="text-brand-text-muted">
        Kein gültiger Bestätigungslink gefunden. Bitte den Link aus der E-Mail verwenden.
      </p>
    );
  }

  if (mutation.isPending || !mutation.isSuccess) {
    if (error) {
      return <p className="text-red-600">{error}</p>;
    }
    return <p className="text-brand-text-muted">Bestätige…</p>;
  }

  if (step === "old") {
    return (
      <div>
        <p className="font-semibold text-brand-heading">Bestätigt!</p>
        <p className="mt-2 text-sm text-brand-text-muted">
          Wir haben eine Bestätigungs-E-Mail an die neue Adresse geschickt. Sobald du auch dort
          bestätigst, ist die Änderung abgeschlossen.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-semibold text-brand-heading">E-Mail-Adresse geändert!</p>
      <p className="mt-2 text-sm text-brand-text-muted">
        Deine neue E-Mail-Adresse ist jetzt {confirmNew.data?.email}. Bitte melde dich mit ihr
        erneut an.
      </p>
    </div>
  );
}
