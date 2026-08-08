import type { Weekday } from "@woodaa/validators";
import { useState } from "react";
import { weekdayOrder, weekdayShortLabels } from "../../lib/weekdayLabels";
import { trpc } from "../../lib/trpc";
import type { RouterOutputs } from "../../lib/trpc";

type Employee = RouterOutputs["operator"]["employees"][number];

export function EmployeeCard({ employee }: { employee: Employee }) {
  const utils = trpc.useUtils();
  const updateEmployee = trpc.operator.updateEmployee.useMutation({
    onSuccess: () => utils.operator.employees.invalidate(),
  });
  const removeEmployee = trpc.operator.removeEmployee.useMutation({
    onSuccess: () => utils.operator.employees.invalidate(),
  });
  const setShift = trpc.operator.setShift.useMutation({
    onSuccess: () => utils.operator.employees.invalidate(),
  });
  const removeShift = trpc.operator.removeShift.useMutation({
    onSuccess: () => utils.operator.employees.invalidate(),
  });

  const [editingWeekday, setEditingWeekday] = useState<Weekday | null>(null);
  const [label, setLabel] = useState("");

  const shiftFor = (weekday: Weekday) => employee.shifts.find((s) => s.weekday === weekday);

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

      <div className="mt-4 flex gap-1.5">
        {weekdayOrder.map((weekday) => {
          const shift = shiftFor(weekday);
          return (
            <button
              key={weekday}
              type="button"
              onClick={() => {
                setEditingWeekday(weekday);
                setLabel(shift?.label ?? "");
              }}
              className={`flex-1 rounded-brand-md border px-1 py-2 text-center text-[11px] font-medium transition-colors duration-250 ${
                shift
                  ? "border-accentScale-500 bg-accentScale-50 text-accentScale-700"
                  : "border-hairline text-ink-300 hover:border-hairline-strong"
              }`}
              title={shift?.label ?? undefined}
            >
              {weekdayShortLabels[weekday]}
            </button>
          );
        })}
      </div>

      {editingWeekday && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setShift.mutate(
              {
                employeeId: employee.id,
                weekday: editingWeekday,
                label: label.trim() || undefined,
              },
              { onSuccess: () => setEditingWeekday(null) },
            );
          }}
        >
          <input
            autoFocus
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={`${weekdayShortLabels[editingWeekday]} - z. B. Frühdienst`}
            className="flex-1 rounded-xl2 border border-hairline bg-canvas px-3 py-1.5 text-sm text-ink-900 outline-none transition-shadow duration-250 focus:border-accentScale-500 focus:shadow-xs"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl2 bg-accentScale-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-250 ease-out-quart hover:bg-accentScale-600"
          >
            Speichern
          </button>
          {shiftFor(editingWeekday) && (
            <button
              type="button"
              onClick={() => {
                const shift = shiftFor(editingWeekday);
                if (shift) removeShift.mutate({ shiftId: shift.id });
                setEditingWeekday(null);
              }}
              className="shrink-0 rounded-xl2 border border-hairline px-3 py-1.5 text-xs font-medium text-ink-500 transition-colors duration-250 hover:bg-canvas"
            >
              Entfernen
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditingWeekday(null)}
            className="shrink-0 px-2 text-xs font-medium text-ink-400"
          >
            ✕
          </button>
        </form>
      )}
    </div>
  );
}
