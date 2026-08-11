import { trpc } from "../../lib/trpc";
import type { RouterOutputs } from "../../lib/trpc";

type Employee = RouterOutputs["operator"]["employees"][number];

// Der Dienstplan (wer wann arbeitet) ist ins Web-Betreiber-Portal
// umgezogen (siehe apps/web/components/dashboard/DienstplanCalendar.tsx,
// echte Kalendertage statt Wochentag-Muster) - diese Karte zeigt hier nur
// noch die Stammdaten der Personalliste.
export function EmployeeCard({ employee }: { employee: Employee }) {
  const utils = trpc.useUtils();
  const updateEmployee = trpc.operator.updateEmployee.useMutation({
    onSuccess: () => utils.operator.employees.invalidate(),
  });
  const removeEmployee = trpc.operator.removeEmployee.useMutation({
    onSuccess: () => utils.operator.employees.invalidate(),
  });

  return (
    <div
      className={`rounded-xl2 border p-5 ${
        employee.active
          ? "border-hairline bg-canvas-panel"
          : "border-hairline bg-canvas-panel opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-900">{employee.name}</p>
          <p className="text-xs text-ink-400">{employee.role}</p>
          {(employee.phone || employee.email) && (
            <p className="mt-0.5 text-xs text-ink-400">
              {[employee.phone, employee.email].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() =>
              updateEmployee.mutate({
                employeeId: employee.id,
                name: employee.name,
                role: employee.role,
                phone: employee.phone ?? undefined,
                email: employee.email ?? undefined,
                active: !employee.active,
              })
            }
            className="text-xs font-medium text-ink-400 transition-colors duration-250 hover:text-ink-900"
          >
            {employee.active ? "Deaktivieren" : "Aktivieren"}
          </button>
          <button
            type="button"
            onClick={() => removeEmployee.mutate({ employeeId: employee.id })}
            className="text-xs font-medium text-ink-400 transition-colors duration-250 hover:text-red-600"
          >
            Entfernen
          </button>
        </div>
      </div>
    </div>
  );
}
