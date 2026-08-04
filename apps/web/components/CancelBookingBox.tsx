"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function CancelBookingBox({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const cancel = trpc.booking.cancel.useMutation();

  if (cancel.isSuccess) {
    return <p className="mt-3 text-sm text-brand-text-muted">Buchung storniert.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm text-brand-text-muted underline hover:text-red-600"
      >
        Doch stornieren?
      </button>
    );
  }

  return (
    <form
      className="mt-3 flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        cancel.mutate({ bookingId, guestEmail: String(form.get("guestEmail") ?? "") });
      }}
    >
      <input
        type="email"
        name="guestEmail"
        required
        placeholder="Deine E-Mail zur Bestätigung"
        className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
      <button
        type="submit"
        disabled={cancel.isPending}
        className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text-muted hover:text-red-600 disabled:opacity-50"
      >
        {cancel.isPending ? "…" : "Stornieren"}
      </button>
      {cancel.isError && <p className="text-sm text-red-600">E-Mail stimmt nicht überein.</p>}
    </form>
  );
}
