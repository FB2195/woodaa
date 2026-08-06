import Link from "next/link";
import { ChevronLeftIcon } from "@/components/account/icons";

// Shared "‹ Zurück zu Mein Konto" + title header for every /konto/* sub-page,
// so drilling into e.g. "Persönliche Angaben" feels like a real subpage
// rather than a modal, matching the Booking.com-style menu on /konto itself.
export function SubPageHeader({ title }: { title: string }) {
  return (
    <div className="mb-6">
      <Link
        href="/konto"
        className="inline-flex items-center gap-1 text-sm text-brand-text-muted hover:text-brand-text"
      >
        <ChevronLeftIcon />
        Mein Konto
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-brand-heading">{title}</h1>
    </div>
  );
}
