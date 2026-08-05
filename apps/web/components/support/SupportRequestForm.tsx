"use client";

import { trpc } from "@/lib/trpc";
import type { SupportRequestType } from "@woodaa/validators";

export function SupportRequestForm({
  type,
  submitLabel,
  phoneRequired = false,
}: {
  type: SupportRequestType;
  submitLabel: string;
  phoneRequired?: boolean;
}) {
  const create = trpc.support.create.useMutation();

  if (create.isSuccess) {
    return (
      <div className="rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
        <p className="font-semibold text-brand-primary-dark">Danke, deine Nachricht ist da!</p>
        <p className="mt-1 text-sm text-brand-text-muted">
          Wir melden uns so schnell wie möglich bei dir.
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
        create.mutate({
          type,
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? "") || undefined,
          message: String(form.get("message") ?? ""),
          pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Name
        <input
          name="name"
          required
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

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
        Telefon{!phoneRequired && " (optional)"}
        <input
          type="tel"
          name="phone"
          required={phoneRequired}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-brand-text">
        Nachricht
        <textarea
          name="message"
          required
          rows={4}
          className="rounded-brand-md border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>

      {create.isError && <p className="text-sm text-red-600">{create.error.message}</p>}

      <button
        type="submit"
        disabled={create.isPending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {create.isPending ? "Wird gesendet…" : submitLabel}
      </button>
    </form>
  );
}
