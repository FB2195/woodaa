import { ExportDataButton } from "@/components/account/ExportDataButton";
import { SubPageHeader } from "@/components/account/SubPageHeader";
import { Header } from "@/components/Header";

export default function MeineDatenPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <SubPageHeader title="Meine Daten exportieren" />
        <p className="text-sm text-brand-text-muted">
          Lade eine Kopie aller Daten herunter, die wir über dich gespeichert haben.
        </p>
        <div className="mt-4">
          <ExportDataButton />
        </div>
      </section>
    </main>
  );
}
