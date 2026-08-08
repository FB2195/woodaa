"use client";

import Link from "next/link";
import type { Pflegegrad } from "@woodaa/validators";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { pflegegradLabels } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc-server";

type SavedSearch = RouterOutputs["savedSearch"]["myList"][number];

function searchUrl(search: SavedSearch): string {
  const params = new URLSearchParams({ city: search.city });
  if (search.bookingType) params.set("type", search.bookingType);
  if (search.pflegegrad) params.set("pflegegrad", String(search.pflegegrad));
  return `/suche?${params.toString()}`;
}

function SavedSearchRow({ search }: { search: SavedSearch }) {
  const utils = trpc.useUtils();
  const remove = trpc.savedSearch.remove.useMutation({
    onSuccess: () => utils.savedSearch.myList.invalidate(),
  });

  return (
    <li className="flex items-center justify-between gap-3 rounded-brand-md border border-brand-border p-4 text-sm">
      <div>
        <Link href={searchUrl(search)} className="font-medium text-brand-text hover:underline">
          {search.city}
        </Link>
        <p className="text-brand-text-muted">
          {[
            search.bookingType ? bookingTypeLabels[search.bookingType] : null,
            search.pflegegrad ? pflegegradLabels[search.pflegegrad as Pflegegrad] : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Alle Leistungen, jeder Pflegegrad"}
        </p>
      </div>
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => remove.mutate({ id: search.id })}
        className="shrink-0 rounded-brand-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text-muted transition hover:text-red-600 disabled:opacity-50"
      >
        Löschen
      </button>
    </li>
  );
}

export function SavedSearchesSection() {
  const { data, isLoading } = trpc.savedSearch.myList.useQuery();

  if (isLoading || !data) return null;

  return (
    <div>
      <p className="mb-4 text-sm text-brand-text-muted">
        Wir informieren dich per E-Mail, sobald eine Einrichtung, die zu einer gespeicherten Suche
        passt, wieder einen freien Platz hat.
      </p>
      {data.length === 0 ? (
        <p className="text-sm text-brand-text-muted">
          Noch keine gespeicherte Suche. Speichere eine Suche über den Button „Suche speichern" auf
          der{" "}
          <Link href="/suche" className="text-brand-accent hover:underline">
            Suchergebnisseite
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((search) => (
            <SavedSearchRow key={search.id} search={search} />
          ))}
        </ul>
      )}
    </div>
  );
}
