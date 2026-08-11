import type { Metadata } from "next";
import { DienstplanCalendar } from "@/components/dashboard/DienstplanCalendar";

export const metadata: Metadata = { title: "Dienstplan" };

export default function OperatorDienstplanPage() {
  return (
    <>
      <div>
        <h1 className="text-xl font-bold text-brand-heading">Dienstplan</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Schichten und Termine der ganzen Woche, stundengenau. Auf ein Zeitfeld klicken, um eine
          Schicht einzutragen; ein bestehender Eintrag lässt sich per Klick bearbeiten oder löschen.
        </p>
      </div>
      <DienstplanCalendar />
    </>
  );
}
