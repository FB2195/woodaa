"use client";

import { useState } from "react";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import type { BookingRequestStatus } from "@prisma/client";

const statusLabels: Record<BookingRequestStatus, string> = {
  OFFEN: "Offen",
  KONTAKTIERT: "Kontaktiert",
  ABGESCHLOSSEN: "Abgeschlossen",
  ABGELEHNT: "Abgelehnt",
};

// Unverbindliche Anfragen (bookingRequest.create) - im Unterschied zu
// WaitlistEntries mit echten Status-Aktionen, weil eine Anfrage aktiv
// beantwortet werden soll, nicht nur passiv "wartet auf freien Platz".
export function BookingRequests() {
  const utils = trpc.useUtils();
  const requests = trpc.operator.bookingRequests.useQuery();
  const [error, setError] = useState<string | null>(null);
  const updateStatus = trpc.operator.updateBookingRequestStatus.useMutation({
    onSuccess: () => utils.operator.bookingRequests.invalidate(),
    onError: (err) => setError(err.message),
  });

  if (!requests.data || requests.data.length === 0) return null;

  const open = requests.data.filter((r) => r.status === "OFFEN" || r.status === "KONTAKTIERT");
  const closed = requests.data.filter(
    (r) => r.status === "ABGESCHLOSSEN" || r.status === "ABGELEHNT",
  );

  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <h2 className="text-lg font-semibold text-brand-heading">
        Anfragen {open.length > 0 && `(${open.length} offen)`}
      </h2>
      <p className="mt-1 text-sm text-brand-text-muted">
        Unverbindliche Anfragen über eure Einrichtungsseite - Familien in dieser Situation
        entscheiden sich oft für die Einrichtung, die zuerst antwortet.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {[...open, ...closed].map((request) => (
          <li
            key={request.id}
            className="flex flex-col gap-1 rounded-brand-md border border-brand-border p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-brand-text">{request.requesterName}</span>
              <span className="text-xs text-brand-text-muted">
                {bookingTypeLabels[request.bookingType]} · {formatDate(request.createdAt)}
              </span>
            </div>
            <p className="text-brand-text-muted">
              {request.requesterEmail}
              {request.requesterPhone && ` · ${request.requesterPhone}`}
              {request.pflegegrad !== null && ` · Pflegegrad ${request.pflegegrad}`}
            </p>
            {request.message && <p className="text-brand-text-muted">„{request.message}"</p>}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-brand-text-muted">
                {statusLabels[request.status]}
              </span>
              {(request.status === "OFFEN" || request.status === "KONTAKTIERT") && (
                <>
                  {request.status === "OFFEN" && (
                    <button
                      type="button"
                      disabled={updateStatus.isPending}
                      onClick={() =>
                        updateStatus.mutate({
                          bookingRequestId: request.id,
                          status: "KONTAKTIERT",
                        })
                      }
                      className="rounded-brand-md border border-brand-border px-2 py-1 text-xs font-semibold text-brand-text-muted hover:text-brand-accent disabled:opacity-50"
                    >
                      Als kontaktiert markieren
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({
                        bookingRequestId: request.id,
                        status: "ABGESCHLOSSEN",
                      })
                    }
                    className="rounded-brand-md border border-brand-border px-2 py-1 text-xs font-semibold text-brand-text-muted hover:text-brand-accent disabled:opacity-50"
                  >
                    Abschließen
                  </button>
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({ bookingRequestId: request.id, status: "ABGELEHNT" })
                    }
                    className="rounded-brand-md border border-brand-border px-2 py-1 text-xs font-semibold text-brand-text-muted hover:text-red-600 disabled:opacity-50"
                  >
                    Ablehnen
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
