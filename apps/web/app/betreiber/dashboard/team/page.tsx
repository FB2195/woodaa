import type { Metadata } from "next";
import { HandoverNotes } from "@/components/dashboard/HandoverNotes";
import { StaffSchedule } from "@/components/dashboard/StaffSchedule";
import { TeamTasks } from "@/components/dashboard/TeamTasks";

export const metadata: Metadata = { title: "Team" };

export default function OperatorTeamPage() {
  return (
    <>
      <div>
        <h1 className="text-xl font-bold text-brand-heading">Team</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Aufgaben, Schicht-Übergabe und Dienstplan für euer Team an einem Ort.
        </p>
      </div>
      <TeamTasks />
      <HandoverNotes />
      <StaffSchedule />
    </>
  );
}
