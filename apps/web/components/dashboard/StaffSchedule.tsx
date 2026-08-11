"use client";

import { useState } from "react";
import type { RouterOutputs } from "@/lib/trpc-server";
import { trpc } from "@/lib/trpc";

type Employee = RouterOutputs["operator"]["employees"][number];

// Team-Roster - see the comment on Employee in schema.prisma: no individual
// staff login, one shared facility account manages this list. The actual
// Dienstplan (when who works) lives in DienstplanCalendar.tsx, which reads
// this same roster for its "wem zuweisen" dropdown.
export function StaffSchedule() {
  const utils = trpc.useUtils();
  const employees = trpc.operator.employees.useQuery();
  const [error, setError] = useState<string | null>(null);

  function reportError(err: unknown) {
    setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
  }

  const invalidate = () => utils.operator.employees.invalidate();

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div>
        <h3 className="font-semibold text-brand-heading">Team</h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Euer Personal - wer im Dienstplan unten zur Auswahl steht.
        </p>
      </div>

      <AddEmployeeForm onError={reportError} onSuccess={invalidate} />

      {employees.isLoading ? (
        <p className="text-sm text-brand-text-muted">Lädt…</p>
      ) : employees.data && employees.data.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {employees.data.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              onError={reportError}
              onChange={invalidate}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-text-muted">
          Noch niemand eingetragen - füg oben euer erstes Teammitglied hinzu.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function AddEmployeeForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (err: unknown) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const addEmployee = trpc.operator.addEmployee.useMutation({
    onSuccess: () => {
      setName("");
      setRole("");
      onSuccess();
    },
    onError,
  });

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmedName = name.trim();
        const trimmedRole = role.trim();
        if (!trimmedName || !trimmedRole) return;
        addEmployee.mutate({ name: trimmedName, role: trimmedRole });
      }}
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        disabled={addEmployee.isPending}
        className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
      <input
        value={role}
        onChange={(event) => setRole(event.target.value)}
        placeholder="Rolle (z.B. Pflegefachkraft)"
        disabled={addEmployee.isPending}
        className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
      <button
        type="submit"
        disabled={addEmployee.isPending || !name.trim() || !role.trim()}
        className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        Hinzufügen
      </button>
    </form>
  );
}

function EmployeeRow({
  employee,
  onChange,
  onError,
}: {
  employee: Employee;
  onChange: () => void;
  onError: (err: unknown) => void;
}) {
  const updateEmployee = trpc.operator.updateEmployee.useMutation({
    onSuccess: onChange,
    onError,
  });
  const removeEmployee = trpc.operator.removeEmployee.useMutation({
    onSuccess: onChange,
    onError,
  });

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-brand-md border border-brand-border p-3">
      <div>
        <span className={employee.active ? "font-medium text-brand-text" : "text-brand-text-muted"}>
          {employee.name}
        </span>
        <span className="ml-2 text-xs text-brand-text-muted">{employee.role}</span>
        {!employee.active && <span className="ml-2 text-xs text-brand-text-muted">(inaktiv)</span>}
      </div>
      <div className="flex items-center gap-3 text-xs">
        <label className="flex items-center gap-1 text-brand-text-muted">
          <input
            type="checkbox"
            checked={employee.active}
            disabled={updateEmployee.isPending}
            onChange={(event) =>
              updateEmployee.mutate({
                employeeId: employee.id,
                name: employee.name,
                role: employee.role,
                phone: employee.phone ?? undefined,
                email: employee.email ?? undefined,
                active: event.target.checked,
              })
            }
          />
          Aktiv
        </label>
        <button
          type="button"
          disabled={removeEmployee.isPending}
          onClick={() => removeEmployee.mutate({ employeeId: employee.id })}
          aria-label={`${employee.name} entfernen`}
          className="text-brand-text-muted hover:text-red-600 disabled:opacity-50"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
