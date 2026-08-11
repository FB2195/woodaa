"use client";

import { useState } from "react";
import type { RouterOutputs } from "@/lib/trpc-server";
import { trpc } from "@/lib/trpc";

type Employee = RouterOutputs["operator"]["employees"][number];

// Team-Roster - see the comment on Employee in schema.prisma: das Heim
// bleibt der eine, gemeinsame Zugang; ein Teammitglied kann aber zusätzlich
// einen eigenen, schreibgeschützten Dienstplan-Zugang bekommen (siehe
// Role.MITARBEITER dort und die Zugang-Spalte in EmployeeRow unten). Der
// eigentliche Dienstplan (wann wer arbeitet) lebt in DienstplanCalendar.tsx,
// die diese Roster-Liste für ihre "wem zuweisen"-Auswahl liest.
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
          Euer Personal - wer im Dienstplan zur Auswahl steht und wer einen eigenen,
          schreibgeschützten Zugang zum Dienstplan bekommt.
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
  const [email, setEmail] = useState(employee.email ?? "");
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);

  const updateEmployee = trpc.operator.updateEmployee.useMutation({
    onSuccess: onChange,
    onError,
  });
  const removeEmployee = trpc.operator.removeEmployee.useMutation({
    onSuccess: onChange,
    onError,
  });
  const inviteAccess = trpc.operator.inviteEmployeeAccess.useMutation({
    onSuccess: onChange,
    onError,
  });
  const revokeAccess = trpc.operator.revokeEmployeeAccess.useMutation({
    onSuccess: () => {
      setConfirmingRevoke(false);
      onChange();
    },
    onError,
  });

  function saveEmail() {
    const trimmed = email.trim();
    if (trimmed === (employee.email ?? "")) return;
    updateEmployee.mutate({
      employeeId: employee.id,
      name: employee.name,
      role: employee.role,
      phone: employee.phone ?? undefined,
      email: trimmed || undefined,
      active: employee.active,
    });
  }

  return (
    <li className="flex flex-col gap-3 rounded-brand-md border border-brand-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span
            className={employee.active ? "font-medium text-brand-text" : "text-brand-text-muted"}
          >
            {employee.name}
          </span>
          <span className="ml-2 text-xs text-brand-text-muted">{employee.role}</span>
          {!employee.active && (
            <span className="ml-2 text-xs text-brand-text-muted">(inaktiv)</span>
          )}
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
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-brand-border pt-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={saveEmail}
          placeholder="E-Mail für Dienstplan-Zugang"
          disabled={Boolean(employee.userId)}
          className="min-w-0 flex-1 rounded-brand-md border border-brand-border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-60"
        />
        {employee.userId ? (
          confirmingRevoke ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-brand-text-muted">Zugang wirklich entziehen?</span>
              <button
                type="button"
                disabled={revokeAccess.isPending}
                onClick={() => revokeAccess.mutate({ employeeId: employee.id })}
                className="rounded-brand-md bg-red-600 px-2.5 py-1 font-semibold text-white disabled:opacity-50"
              >
                Ja
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRevoke(false)}
                className="text-brand-text-muted"
              >
                Abbrechen
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-brand-full bg-brand-accent/10 px-2 py-0.5 font-medium text-brand-accent">
                Zugang aktiv
              </span>
              <button
                type="button"
                onClick={() => setConfirmingRevoke(true)}
                className="text-brand-text-muted hover:text-red-600"
              >
                Entziehen
              </button>
            </div>
          )
        ) : (
          <button
            type="button"
            disabled={inviteAccess.isPending || !email.trim()}
            onClick={() => inviteAccess.mutate({ employeeId: employee.id })}
            title={!email.trim() ? "Erst E-Mail-Adresse eintragen" : undefined}
            className="shrink-0 rounded-brand-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text transition hover:bg-brand-background disabled:opacity-50"
          >
            {inviteAccess.isPending ? "…" : "Zugang einrichten"}
          </button>
        )}
      </div>
      {inviteAccess.isSuccess && (
        <p className="text-xs text-brand-accent">
          Einladung verschickt - {employee.name} bekommt eine E-Mail zum Passwort-Setzen.
        </p>
      )}
    </li>
  );
}
