import { useState } from "react";
import { AddEmployeeDialog } from "../components/personal/AddEmployeeDialog";
import { EmployeeCard } from "../components/personal/EmployeeCard";
import { trpc } from "../lib/trpc";

export function PersonalPage() {
  const employeesQuery = trpc.operator.employees.useQuery();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="pt-8">
      <div className="app-no-drag flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Personal</h1>
          <p className="mt-1 text-sm text-ink-500">
            Mitarbeiter-Übersicht und wöchentliche Einteilung - ohne eigene Logins, verwaltet über
            euer Einrichtungskonto.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="shrink-0 rounded-xl2 bg-accentScale-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-250 ease-out-quart hover:bg-accentScale-600"
        >
          + Mitarbeiter:in
        </button>
      </div>

      <div className="app-no-drag mt-6 space-y-3">
        {(employeesQuery.data ?? []).map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
        {employeesQuery.data?.length === 0 && (
          <p className="text-sm text-ink-400">Noch keine Mitarbeiter:innen erfasst.</p>
        )}
      </div>

      {showAdd && <AddEmployeeDialog onClose={() => setShowAdd(false)} />}
    </div>
  );
}
