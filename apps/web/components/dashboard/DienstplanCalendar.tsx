"use client";

import { useState } from "react";
import type { AppointmentCategory } from "@woodaa/validators";
import type { RouterOutputs } from "@/lib/trpc-server";
import { trpc } from "@/lib/trpc";
import {
  addDays,
  formatDayHeader,
  formatWeekRange,
  isToday,
  startOfWeek,
  toDateKey,
  weekDays,
} from "@/lib/weekRange";

type Employee = RouterOutputs["operator"]["employees"][number];
type Shift = RouterOutputs["operator"]["shifts"][number];
type Appointment = RouterOutputs["operator"]["appointments"][number];

const CATEGORY_LABELS: Record<AppointmentCategory, string> = {
  ARZTTERMIN: "Arzttermin",
  BESUCH: "Besuch",
  INTERN: "Intern",
  SONSTIGES: "Sonstiges",
};

const CATEGORY_STYLES: Record<AppointmentCategory, string> = {
  ARZTTERMIN:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200",
  BESUCH:
    "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200",
  INTERN:
    "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200",
  SONSTIGES:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
};

const SHIFT_CHIP_STYLE =
  "border-brand-accent/40 bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20";

function ShiftChip({ shift, onClick }: { shift: Shift; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-brand-md border px-2 py-1.5 text-left text-xs transition hover:shadow-sm ${SHIFT_CHIP_STYLE}`}
    >
      <span className="block break-words font-semibold">{shift.employee.name}</span>
      <span className="block break-words opacity-90">
        {shift.startTime}–{shift.endTime}
        {shift.shiftType ? ` · ${shift.shiftType}` : ""}
      </span>
    </button>
  );
}

function AppointmentChip({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-brand-md border px-2 py-1.5 text-left text-xs transition hover:shadow-sm ${CATEGORY_STYLES[appointment.category]}`}
    >
      <span className="block break-words font-semibold">{appointment.title}</span>
      <span className="block break-words opacity-90">
        {appointment.startTime
          ? `${appointment.startTime}${appointment.endTime ? `–${appointment.endTime}` : ""} · `
          : ""}
        {CATEGORY_LABELS[appointment.category]}
      </span>
    </button>
  );
}

type ModalState =
  | { kind: "shift"; date: Date; shift?: Shift }
  | { kind: "appointment"; date: Date; appointment?: Appointment };

function ShiftForm({
  date,
  shift,
  employees,
  onClose,
}: {
  date: Date;
  shift?: Shift;
  employees: Employee[];
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [employeeId, setEmployeeId] = useState(shift?.employeeId ?? employees[0]?.id ?? "");
  const [startTime, setStartTime] = useState(shift?.startTime ?? "07:00");
  const [endTime, setEndTime] = useState(shift?.endTime ?? "15:00");
  const [shiftType, setShiftType] = useState(shift?.shiftType ?? "");
  const [note, setNote] = useState(shift?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () =>
    Promise.all([utils.operator.shifts.invalidate(), utils.operator.appointments.invalidate()]);
  const upsertShift = trpc.operator.upsertShift.useMutation({
    onSuccess: async () => {
      await invalidate();
      onClose();
    },
    onError: (err) => setError(err.message),
  });
  const removeShift = trpc.operator.removeShift.useMutation({
    onSuccess: async () => {
      await invalidate();
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  if (employees.length === 0) {
    return (
      <p className="text-sm text-brand-text-muted">
        Erst im Personal-Bereich ein Teammitglied anlegen, bevor ihr Schichten einträgt.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        upsertShift.mutate({
          shiftId: shift?.id,
          employeeId,
          date: date.toISOString(),
          startTime,
          endTime,
          shiftType: shiftType.trim() || undefined,
          note: note.trim() || undefined,
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
        Mitarbeiter:in
        <select
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
              {!employee.active ? " (inaktiv)" : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-xs text-brand-text-muted">
          Von
          <input
            type="time"
            required
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-brand-text-muted">
          Bis
          <input
            type="time"
            required
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
        Schichttyp (optional)
        <input
          value={shiftType}
          onChange={(event) => setShiftType(event.target.value)}
          placeholder="z.B. Frühdienst"
          className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
        Notiz (optional)
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="z.B. Vertretung für Anna, krank"
          className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={upsertShift.isPending}
          className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {upsertShift.isPending ? "…" : "Speichern"}
        </button>
        {shift && (
          <button
            type="button"
            disabled={removeShift.isPending}
            onClick={() => removeShift.mutate({ shiftId: shift.id })}
            className="rounded-brand-md border border-brand-border px-4 py-2 text-sm text-brand-text-muted hover:text-red-600 disabled:opacity-50"
          >
            Löschen
          </button>
        )}
      </div>
    </form>
  );
}

function AppointmentForm({
  date,
  appointment,
  onClose,
}: {
  date: Date;
  appointment?: Appointment;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(appointment?.title ?? "");
  const [category, setCategory] = useState<AppointmentCategory>(
    appointment?.category ?? "SONSTIGES",
  );
  const [startTime, setStartTime] = useState(appointment?.startTime ?? "");
  const [endTime, setEndTime] = useState(appointment?.endTime ?? "");
  const [note, setNote] = useState(appointment?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () =>
    Promise.all([utils.operator.shifts.invalidate(), utils.operator.appointments.invalidate()]);
  const upsertAppointment = trpc.operator.upsertAppointment.useMutation({
    onSuccess: async () => {
      await invalidate();
      onClose();
    },
    onError: (err) => setError(err.message),
  });
  const removeAppointment = trpc.operator.removeAppointment.useMutation({
    onSuccess: async () => {
      await invalidate();
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        setError(null);
        upsertAppointment.mutate({
          appointmentId: appointment?.id,
          date: date.toISOString(),
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          title: trimmedTitle,
          category,
          note: note.trim() || undefined,
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
        Titel
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="z.B. Hausarztbesuch Frau Weber"
          className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
        Kategorie
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as AppointmentCategory)}
          className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {(Object.keys(CATEGORY_LABELS) as AppointmentCategory[]).map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-xs text-brand-text-muted">
          Von (optional)
          <input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-brand-text-muted">
          Bis (optional)
          <input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
        Notiz (optional)
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={upsertAppointment.isPending}
          className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {upsertAppointment.isPending ? "…" : "Speichern"}
        </button>
        {appointment && (
          <button
            type="button"
            disabled={removeAppointment.isPending}
            onClick={() => removeAppointment.mutate({ appointmentId: appointment.id })}
            className="rounded-brand-md border border-brand-border px-4 py-2 text-sm text-brand-text-muted hover:text-red-600 disabled:opacity-50"
          >
            Löschen
          </button>
        )}
      </div>
    </form>
  );
}

function DayModal({
  state,
  employees,
  onClose,
}: {
  state: ModalState;
  employees: Employee[];
  onClose: () => void;
}) {
  const dateLabel = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(state.date);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={state.kind === "shift" ? "Schicht" : "Termin"}
        className="flex max-h-[85vh] w-full flex-col gap-4 overflow-y-auto rounded-t-brand-lg border border-brand-border bg-brand-surface p-6 shadow-xl sm:max-w-md sm:rounded-brand-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-text-muted">
              {state.kind === "shift" ? "Schicht" : "Termin"}
            </p>
            <p className="text-lg font-bold text-brand-heading">{dateLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="shrink-0 rounded-brand-md p-1 text-brand-text-muted hover:text-brand-text"
          >
            ✕
          </button>
        </div>
        {state.kind === "shift" ? (
          <ShiftForm
            date={state.date}
            shift={state.shift}
            employees={employees}
            onClose={onClose}
          />
        ) : (
          <AppointmentForm date={state.date} appointment={state.appointment} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function DayColumn({
  date,
  shifts,
  appointments,
  onAddShift,
  onAddAppointment,
  onSelectShift,
  onSelectAppointment,
}: {
  date: Date;
  shifts: Shift[];
  appointments: Appointment[];
  onAddShift: () => void;
  onAddAppointment: () => void;
  onSelectShift: (shift: Shift) => void;
  onSelectAppointment: (appointment: Appointment) => void;
}) {
  const today = isToday(date);
  return (
    <div
      className={`flex min-w-0 flex-col gap-2 rounded-brand-lg border p-3 ${
        today ? "border-brand-accent bg-brand-accent/5" : "border-brand-border bg-brand-surface"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${today ? "text-brand-accent" : "text-brand-text-muted"}`}
      >
        {formatDayHeader(date)}
      </p>
      <div className="flex flex-col gap-1.5">
        {shifts.map((shift) => (
          <ShiftChip key={shift.id} shift={shift} onClick={() => onSelectShift(shift)} />
        ))}
        {appointments.map((appointment) => (
          <AppointmentChip
            key={appointment.id}
            appointment={appointment}
            onClick={() => onSelectAppointment(appointment)}
          />
        ))}
        {shifts.length === 0 && appointments.length === 0 && (
          <p className="text-xs text-brand-text-muted">Nichts geplant</p>
        )}
      </div>
      <div className="mt-auto flex flex-col gap-1 pt-1">
        <button
          type="button"
          onClick={onAddShift}
          className="rounded-brand-md border border-dashed border-brand-border px-2 py-1 text-xs font-medium text-brand-text-muted transition hover:border-brand-accent hover:text-brand-accent"
        >
          + Schicht
        </button>
        <button
          type="button"
          onClick={onAddAppointment}
          className="rounded-brand-md border border-dashed border-brand-border px-2 py-1 text-xs font-medium text-brand-text-muted transition hover:border-brand-accent hover:text-brand-accent"
        >
          + Termin
        </button>
      </div>
    </div>
  );
}

export function DienstplanCalendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [modal, setModal] = useState<ModalState | null>(null);
  const days = weekDays(weekStart);
  const rangeEnd = addDays(weekStart, 7);

  const employees = trpc.operator.employees.useQuery();
  const shifts = trpc.operator.shifts.useQuery({
    from: weekStart.toISOString(),
    to: rangeEnd.toISOString(),
  });
  const appointments = trpc.operator.appointments.useQuery({
    from: weekStart.toISOString(),
    to: rangeEnd.toISOString(),
  });

  const shiftsByDay = new Map<string, Shift[]>();
  for (const shift of shifts.data ?? []) {
    const key = toDateKey(shift.date);
    shiftsByDay.set(key, [...(shiftsByDay.get(key) ?? []), shift]);
  }
  const appointmentsByDay = new Map<string, Appointment[]>();
  for (const appointment of appointments.data ?? []) {
    const key = toDateKey(appointment.date);
    appointmentsByDay.set(key, [...(appointmentsByDay.get(key) ?? []), appointment]);
  }

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-brand-heading">Dienstplan &amp; Termine</h3>
          <p className="mt-1 text-sm text-brand-text-muted">{formatWeekRange(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-brand-md border border-brand-border px-3 py-1.5 text-sm font-medium text-brand-text transition hover:bg-brand-background"
          >
            Heute
          </button>
          <button
            type="button"
            aria-label="Vorherige Woche"
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
            className="rounded-brand-md border border-brand-border px-3 py-1.5 text-sm font-medium text-brand-text transition hover:bg-brand-background"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Nächste Woche"
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
            className="rounded-brand-md border border-brand-border px-3 py-1.5 text-sm font-medium text-brand-text transition hover:bg-brand-background"
          >
            →
          </button>
        </div>
      </div>

      {shifts.isLoading || appointments.isLoading || employees.isLoading ? (
        <p className="text-sm text-brand-text-muted">Lädt…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((day) => {
            const key = toDateKey(day);
            return (
              <DayColumn
                key={key}
                date={day}
                shifts={shiftsByDay.get(key) ?? []}
                appointments={appointmentsByDay.get(key) ?? []}
                onAddShift={() => setModal({ kind: "shift", date: day })}
                onAddAppointment={() => setModal({ kind: "appointment", date: day })}
                onSelectShift={(shift) => setModal({ kind: "shift", date: day, shift })}
                onSelectAppointment={(appointment) =>
                  setModal({ kind: "appointment", date: day, appointment })
                }
              />
            );
          })}
        </div>
      )}

      {modal && (
        <DayModal state={modal} employees={employees.data ?? []} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
