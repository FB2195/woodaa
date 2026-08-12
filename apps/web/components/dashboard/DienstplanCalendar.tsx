"use client";

import { useState } from "react";
import type { AbsenceType, AppointmentCategory } from "@woodaa/validators";
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
type Absence = RouterOutputs["operator"]["absences"][number];

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

const SHIFT_BLOCK_STYLE =
  "border-brand-accent/40 bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20";

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  URLAUB: "Urlaub",
  KRANKHEIT: "Krankheit",
  SONSTIGES: "Sonstiges",
};

const ABSENCE_STYLES: Record<AbsenceType, string> = {
  URLAUB:
    "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-200",
  KRANKHEIT:
    "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
  SONSTIGES:
    "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200",
};

// AUSSTEHEND-Anfragen bleiben im Kalender sichtbar (gestrichelt), damit man
// bei der Schichtplanung sieht "hier ist evtl. jemand raus", auch bevor der
// Chef entschieden hat - abgelehnte werden gar nicht erst mitgegeben (siehe
// absencesForDay unten).
function absenceBlockStyle(absence: Absence): string {
  return absence.status === "AUSSTEHEND"
    ? `border-dashed opacity-80 ${ABSENCE_STYLES[absence.type]}`
    : ABSENCE_STYLES[absence.type];
}

function absencesForDay(absences: Absence[], dateKey: string): Absence[] {
  return absences.filter(
    (absence) =>
      absence.status !== "ABGELEHNT" &&
      toDateKey(absence.startDate) <= dateKey &&
      toDateKey(absence.endDate) >= dateKey,
  );
}

// --- time/layout helpers -----------------------------------------------

function minutesFromMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

const HOUR_HEIGHT = 44; // px per hour row in the grid
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MIN_BLOCK_HEIGHT = 26; // px - keeps very short appointments legible

type PositionedBlock<T> = {
  item: T;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
};

// Greedy lane assignment for same-day overlapping blocks (e.g. two
// employees both scheduled 08:00-16:00) - sorted by start, each block
// takes the first lane whose last block already ended, or opens a new one.
// Every block then knows its own lane and the day's total lane count, so
// the caller can render them side by side instead of stacked on top of
// each other.
function assignLanes<T>(entries: { item: T; start: number; end: number }[]): PositionedBlock<T>[] {
  const sorted = [...entries].sort((a, b) => a.start - b.start);
  const laneEnds: number[] = [];
  const withLane = sorted.map((entry) => {
    let lane = laneEnds.findIndex((end) => end <= entry.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(entry.end);
    } else {
      laneEnds[lane] = entry.end;
    }
    return { ...entry, lane };
  });
  const laneCount = Math.max(1, laneEnds.length);
  return withLane.map(({ item, start, end, lane }) => ({
    item,
    top: (start / 60) * HOUR_HEIGHT,
    height: Math.max(MIN_BLOCK_HEIGHT, ((end - start) / 60) * HOUR_HEIGHT),
    lane,
    laneCount,
  }));
}

// A shift ending at/before its own start time (e.g. Nachtdienst 23:00-07:00)
// spans into the next calendar day - split it into "tonight, until
// midnight" on its own date and a short "since midnight" continuation
// rendered at the top of the next day's column.
type ShiftEntry = { start: number; end: number; shift: Shift; continuation: boolean };
function shiftEntriesForDay(shifts: Shift[], dateKey: string): ShiftEntry[] {
  const entries: ShiftEntry[] = [];
  for (const shift of shifts) {
    const start = minutesFromMidnight(shift.startTime);
    const end = minutesFromMidnight(shift.endTime);
    const shiftDateKey = toDateKey(shift.date);
    const overnight = end <= start;

    if (shiftDateKey === dateKey) {
      entries.push({ start, end: overnight ? 24 * 60 : end, shift, continuation: false });
    }
    if (overnight && toDateKey(addDays(new Date(shift.date), 1)) === dateKey) {
      entries.push({ start: 0, end, shift, continuation: true });
    }
  }
  return entries;
}

// --- shared form/modal pieces (BETREIBER only) --------------------------

type ModalState =
  | { kind: "shift"; date: Date; shift?: Shift; startTime?: string }
  | { kind: "appointment"; date: Date; appointment?: Appointment }
  | { kind: "view-shift"; date: Date; shift: Shift }
  | { kind: "view-appointment"; date: Date; appointment: Appointment }
  | { kind: "view-absence"; date: Date; absence: Absence };

function ShiftForm({
  date,
  shift,
  startTime,
  employees,
  onClose,
}: {
  date: Date;
  shift?: Shift;
  startTime?: string;
  employees: Employee[];
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [employeeId, setEmployeeId] = useState(shift?.employeeId ?? employees[0]?.id ?? "");
  const [startTimeValue, setStartTimeValue] = useState(shift?.startTime ?? startTime ?? "07:00");
  const [endTimeValue, setEndTimeValue] = useState(shift?.endTime ?? "15:00");
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
          startTime: startTimeValue,
          endTime: endTimeValue,
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
            value={startTimeValue}
            onChange={(event) => setStartTimeValue(event.target.value)}
            className="rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-brand-text-muted">
          Bis
          <input
            type="time"
            required
            value={endTimeValue}
            onChange={(event) => setEndTimeValue(event.target.value)}
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

function ShiftDetail({ shift }: { shift: Shift }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="font-semibold text-brand-text">{shift.employee.name}</p>
      <p className="text-brand-text-muted">
        {shift.startTime}–{shift.endTime}
        {shift.shiftType ? ` · ${shift.shiftType}` : ""}
      </p>
      {shift.note && <p className="mt-1 text-brand-text-muted">{shift.note}</p>}
    </div>
  );
}

function AppointmentDetail({ appointment }: { appointment: Appointment }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="font-semibold text-brand-text">{appointment.title}</p>
      <p className="text-brand-text-muted">
        {appointment.startTime
          ? `${appointment.startTime}${appointment.endTime ? `–${appointment.endTime}` : ""} · `
          : ""}
        {CATEGORY_LABELS[appointment.category]}
      </p>
      {appointment.note && <p className="mt-1 text-brand-text-muted">{appointment.note}</p>}
    </div>
  );
}

function AbsenceDetail({
  absence,
  readOnly,
  onClose,
}: {
  absence: Absence;
  readOnly: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const invalidate = () => utils.operator.absences.invalidate();
  const decideAbsence = trpc.operator.decideAbsence.useMutation({
    onSuccess: async () => {
      await invalidate();
      onClose();
    },
  });
  const removeAbsence = trpc.operator.removeAbsence.useMutation({
    onSuccess: async () => {
      await invalidate();
      onClose();
    },
  });

  const dateRange =
    toDateKey(absence.startDate) === toDateKey(absence.endDate)
      ? new Intl.DateTimeFormat("de-DE").format(new Date(absence.startDate))
      : `${new Intl.DateTimeFormat("de-DE").format(new Date(absence.startDate))} – ${new Intl.DateTimeFormat("de-DE").format(new Date(absence.endDate))}`;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <p className="font-semibold text-brand-text">{absence.employee.name}</p>
        <p className="text-brand-text-muted">
          {ABSENCE_TYPE_LABELS[absence.type]} · {dateRange}
        </p>
        <p className="mt-1 text-xs text-brand-text-muted">
          Status:{" "}
          {absence.status === "AUSSTEHEND"
            ? "Ausstehend"
            : absence.status === "GENEHMIGT"
              ? "Genehmigt"
              : "Abgelehnt"}
        </p>
      </div>
      {absence.note && <p className="text-brand-text-muted">{absence.note}</p>}
      {!readOnly && (
        <div className="flex flex-wrap gap-2 border-t border-brand-border pt-3">
          {absence.status === "AUSSTEHEND" && (
            <>
              <button
                type="button"
                disabled={decideAbsence.isPending}
                onClick={() => decideAbsence.mutate({ absenceId: absence.id, status: "GENEHMIGT" })}
                className="rounded-brand-md bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                Genehmigen
              </button>
              <button
                type="button"
                disabled={decideAbsence.isPending}
                onClick={() => decideAbsence.mutate({ absenceId: absence.id, status: "ABGELEHNT" })}
                className="rounded-brand-md border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-text transition hover:bg-brand-background disabled:opacity-50"
              >
                Ablehnen
              </button>
            </>
          )}
          <button
            type="button"
            disabled={removeAbsence.isPending}
            onClick={() => removeAbsence.mutate({ absenceId: absence.id })}
            className="rounded-brand-md border border-brand-border px-3 py-1.5 text-xs text-brand-text-muted transition hover:text-red-600 disabled:opacity-50"
          >
            Löschen
          </button>
        </div>
      )}
    </div>
  );
}

function DayModal({
  state,
  employees,
  readOnly,
  onClose,
}: {
  state: ModalState;
  employees: Employee[];
  readOnly: boolean;
  onClose: () => void;
}) {
  const dateLabel = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(state.date);

  const title =
    state.kind === "shift" || state.kind === "view-shift"
      ? "Schicht"
      : state.kind === "view-absence"
        ? "Abwesenheit"
        : "Termin";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[85vh] w-full flex-col gap-4 overflow-y-auto rounded-t-brand-lg border border-brand-border bg-brand-surface p-6 shadow-xl sm:max-w-md sm:rounded-brand-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-text-muted">
              {title}
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
        {state.kind === "view-absence" ? (
          <AbsenceDetail absence={state.absence} readOnly={readOnly} onClose={onClose} />
        ) : readOnly ? (
          state.kind === "view-shift" ? (
            <ShiftDetail shift={state.shift} />
          ) : state.kind === "view-appointment" ? (
            <AppointmentDetail appointment={state.appointment} />
          ) : null
        ) : state.kind === "shift" ? (
          <ShiftForm
            date={state.date}
            shift={state.shift}
            startTime={state.startTime}
            employees={employees}
            onClose={onClose}
          />
        ) : state.kind === "appointment" ? (
          <AppointmentForm date={state.date} appointment={state.appointment} onClose={onClose} />
        ) : null}
      </div>
    </div>
  );
}

// --- grid (desktop) -------------------------------------------------

function GridBlock<T>({
  block,
  className,
  onClick,
  children,
}: {
  block: PositionedBlock<T>;
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const widthPct = 100 / block.laneCount;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      style={{
        top: block.top,
        height: block.height,
        left: `${block.lane * widthPct}%`,
        width: `calc(${widthPct}% - 2px)`,
      }}
      className={`absolute overflow-hidden rounded-brand-md border px-1.5 py-1 text-left text-[11px] leading-tight transition hover:z-10 hover:shadow-md ${className}`}
    >
      {children}
    </button>
  );
}

function DayGridColumn({
  date,
  shifts,
  appointments,
  absences,
  readOnly,
  onAddShift,
  onSelectShift,
  onSelectAppointment,
  onSelectAbsence,
}: {
  date: Date;
  shifts: Shift[];
  appointments: Appointment[];
  absences: Absence[];
  readOnly: boolean;
  onAddShift: (startTime: string) => void;
  onSelectShift: (shift: Shift) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onSelectAbsence: (absence: Absence) => void;
}) {
  const dateKey = toDateKey(date);
  const dayAbsences = absencesForDay(absences, dateKey);
  const shiftBlocks = assignLanes(
    shiftEntriesForDay(shifts, dateKey).map((entry) => ({
      item: entry,
      start: entry.start,
      end: entry.end,
    })),
  );
  const timedAppointments = appointments.filter((a) => a.startTime);
  const appointmentBlocks = assignLanes(
    timedAppointments.map((appointment) => ({
      item: appointment,
      start: minutesFromMidnight(appointment.startTime!),
      end: appointment.endTime
        ? minutesFromMidnight(appointment.endTime)
        : minutesFromMidnight(appointment.startTime!) + 30,
    })),
  );
  const untimedAppointments = appointments.filter((a) => !a.startTime);

  return (
    <div className="relative min-w-0 border-l border-brand-border">
      {(dayAbsences.length > 0 || untimedAppointments.length > 0) && (
        <div className="flex flex-col gap-0.5 border-b border-brand-border p-1">
          {dayAbsences.map((absence) => (
            <button
              key={absence.id}
              type="button"
              onClick={() => onSelectAbsence(absence)}
              className={`truncate rounded-brand-md border px-1.5 py-0.5 text-left text-[11px] ${absenceBlockStyle(absence)}`}
            >
              {absence.employee.name} · {ABSENCE_TYPE_LABELS[absence.type]}
              {absence.status === "AUSSTEHEND" ? " (offen)" : ""}
            </button>
          ))}
          {untimedAppointments.map((appointment) => (
            <button
              key={appointment.id}
              type="button"
              onClick={() => onSelectAppointment(appointment)}
              className={`truncate rounded-brand-md border px-1.5 py-0.5 text-left text-[11px] ${CATEGORY_STYLES[appointment.category]}`}
            >
              {appointment.title}
            </button>
          ))}
        </div>
      )}
      <div className="relative" style={{ height: HOUR_HEIGHT * 24 }}>
        {HOURS.map((hour) => (
          <div
            key={hour}
            style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            className="absolute inset-x-0 border-t border-brand-border/60"
            onClick={readOnly ? undefined : () => onAddShift(`${String(hour).padStart(2, "0")}:00`)}
            role={readOnly ? undefined : "button"}
            aria-hidden={readOnly}
            tabIndex={-1}
          >
            {!readOnly && (
              <span className="pointer-events-none absolute inset-0 hover:bg-brand-accent/5" />
            )}
          </div>
        ))}
        {shiftBlocks.map((block) => (
          <GridBlock
            key={`${block.item.shift.id}-${block.item.continuation ? "cont" : "main"}`}
            block={block}
            className={SHIFT_BLOCK_STYLE}
            onClick={() => onSelectShift(block.item.shift)}
          >
            <span className="block truncate font-semibold">{block.item.shift.employee.name}</span>
            <span className="block truncate opacity-90">
              {block.item.continuation
                ? `bis ${block.item.shift.endTime}`
                : block.item.shift.startTime}
              {block.item.shift.shiftType ? ` · ${block.item.shift.shiftType}` : ""}
            </span>
          </GridBlock>
        ))}
        {appointmentBlocks.map((block) => (
          <GridBlock
            key={block.item.id}
            block={block}
            className={CATEGORY_STYLES[block.item.category]}
            onClick={() => onSelectAppointment(block.item)}
          >
            <span className="block truncate font-semibold">{block.item.title}</span>
            <span className="block truncate opacity-90">{block.item.startTime}</span>
          </GridBlock>
        ))}
      </div>
    </div>
  );
}

function WeekGrid({
  days,
  shiftsByDay,
  appointmentsByDay,
  absences,
  readOnly,
  onAddShift,
  onQuickAddShift,
  onSelectShift,
  onSelectAppointment,
  onSelectAbsence,
}: {
  days: Date[];
  shiftsByDay: Map<string, Shift[]>;
  appointmentsByDay: Map<string, Appointment[]>;
  absences: Absence[];
  readOnly: boolean;
  onAddShift: (day: Date, startTime: string) => void;
  onQuickAddShift: (day: Date) => void;
  onSelectShift: (day: Date, shift: Shift) => void;
  onSelectAppointment: (day: Date, appointment: Appointment) => void;
  onSelectAbsence: (absence: Absence) => void;
}) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <div className="grid grid-cols-[3rem_repeat(7,minmax(9rem,1fr))]">
        <div className="sticky top-0 z-10 bg-brand-surface" />
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={toDateKey(day)}
              className={`sticky top-0 z-10 flex items-center justify-center gap-1.5 border-l border-brand-border bg-brand-surface px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide ${
                today ? "text-brand-accent" : "text-brand-text-muted"
              }`}
            >
              {formatDayHeader(day)}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onQuickAddShift(day)}
                  aria-label={`Schicht am ${formatDayHeader(day)} hinzufügen`}
                  title="Weitere Schicht hinzufügen - z.B. für ein zweites Teammitglied zur gleichen Zeit"
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px] leading-none normal-case text-brand-text-muted transition hover:border-brand-accent hover:text-brand-accent"
                >
                  +
                </button>
              )}
            </div>
          );
        })}

        <div className="relative" style={{ height: HOUR_HEIGHT * 24 }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              className="absolute inset-x-0 flex items-start justify-end pr-2 text-[11px] text-brand-text-muted"
            >
              <span className="-translate-y-1/2">{hour}:00</span>
            </div>
          ))}
        </div>
        {days.map((day) => {
          const key = toDateKey(day);
          return (
            <DayGridColumn
              key={key}
              date={day}
              shifts={shiftsByDay.get(key) ?? []}
              appointments={appointmentsByDay.get(key) ?? []}
              absences={absences}
              readOnly={readOnly}
              onAddShift={(startTime) => onAddShift(day, startTime)}
              onSelectShift={(shift) => onSelectShift(day, shift)}
              onSelectAppointment={(appointment) => onSelectAppointment(day, appointment)}
              onSelectAbsence={onSelectAbsence}
            />
          );
        })}
      </div>
    </div>
  );
}

// --- mobile agenda fallback ----------------------------------------

function AgendaDay({
  date,
  shifts,
  appointments,
  absences,
  readOnly,
  onAddShift,
  onAddAppointment,
  onSelectShift,
  onSelectAppointment,
  onSelectAbsence,
}: {
  date: Date;
  shifts: Shift[];
  appointments: Appointment[];
  absences: Absence[];
  readOnly: boolean;
  onAddShift: () => void;
  onAddAppointment: () => void;
  onSelectShift: (shift: Shift) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onSelectAbsence: (absence: Absence) => void;
}) {
  const today = isToday(date);
  const dayAbsences = absencesForDay(absences, toDateKey(date));
  const sortedShifts = [...shifts].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const sortedAppointments = [...appointments].sort((a, b) =>
    (a.startTime ?? "").localeCompare(b.startTime ?? ""),
  );
  return (
    <div
      className={`flex flex-col gap-2 rounded-brand-lg border p-3 ${
        today ? "border-brand-accent bg-brand-accent/5" : "border-brand-border bg-brand-surface"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${today ? "text-brand-accent" : "text-brand-text-muted"}`}
      >
        {formatDayHeader(date)}
      </p>
      <div className="flex flex-col gap-1.5">
        {dayAbsences.map((absence) => (
          <button
            key={absence.id}
            type="button"
            onClick={() => onSelectAbsence(absence)}
            className={`w-full rounded-brand-md border px-2 py-1.5 text-left text-xs transition hover:shadow-sm ${absenceBlockStyle(absence)}`}
          >
            <span className="block break-words font-semibold">{absence.employee.name}</span>
            <span className="block break-words opacity-90">
              {ABSENCE_TYPE_LABELS[absence.type]}
              {absence.status === "AUSSTEHEND" ? " · offen" : ""}
            </span>
          </button>
        ))}
        {sortedShifts.map((shift) => (
          <button
            key={shift.id}
            type="button"
            onClick={() => onSelectShift(shift)}
            className={`w-full rounded-brand-md border px-2 py-1.5 text-left text-xs transition hover:shadow-sm ${SHIFT_BLOCK_STYLE}`}
          >
            <span className="block break-words font-semibold">{shift.employee.name}</span>
            <span className="block break-words opacity-90">
              {shift.startTime}–{shift.endTime}
              {shift.shiftType ? ` · ${shift.shiftType}` : ""}
            </span>
          </button>
        ))}
        {sortedAppointments.map((appointment) => (
          <button
            key={appointment.id}
            type="button"
            onClick={() => onSelectAppointment(appointment)}
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
        ))}
        {shifts.length === 0 && appointments.length === 0 && dayAbsences.length === 0 && (
          <p className="text-xs text-brand-text-muted">Nichts geplant</p>
        )}
      </div>
      {!readOnly && (
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
      )}
    </div>
  );
}

// --- Soll/Ist-Stunden + Abwesenheiten (BETREIBER only) -----------------

function formatHours(minutes: number): string {
  return `${(minutes / 60).toLocaleString("de-DE", { maximumFractionDigits: 1 })} h`;
}

// Reine Stundenübersicht, bewusst ohne Stundenlohn/€-Bezug - siehe
// employmentType/weeklyHoursTarget in schema.prisma. Ist-Stunden kommen
// direkt aus den `shifts` der angezeigten Woche (unabhängig vom Tag-für-Tag-
// Splitting für die Kalenderdarstellung), Soll aus Employee.weeklyHoursTarget.
function SollIstPanel({ employees, shifts }: { employees: Employee[]; shifts: Shift[] }) {
  const workedMinutes = new Map<string, number>();
  for (const shift of shifts) {
    const start = minutesFromMidnight(shift.startTime);
    const end = minutesFromMidnight(shift.endTime);
    const duration = end > start ? end - start : 24 * 60 - start + end;
    workedMinutes.set(shift.employeeId, (workedMinutes.get(shift.employeeId) ?? 0) + duration);
  }
  const rows = employees
    .filter((employee) => employee.active)
    .map((employee) => ({ employee, ist: workedMinutes.get(employee.id) ?? 0 }))
    .filter((row) => row.ist > 0 || row.employee.weeklyHoursTarget != null);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-brand-lg border border-brand-border p-4">
      <h4 className="text-sm font-semibold text-brand-heading">Soll/Ist-Stunden diese Woche</h4>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[24rem] text-left text-sm">
          <thead>
            <tr className="text-xs text-brand-text-muted">
              <th className="pb-1 pr-3 font-medium">Teammitglied</th>
              <th className="pb-1 pr-3 font-medium">Ist</th>
              <th className="pb-1 pr-3 font-medium">Soll</th>
              <th className="pb-1 font-medium">Differenz</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ employee, ist }) => {
              const sollMinutes =
                employee.weeklyHoursTarget != null ? employee.weeklyHoursTarget * 60 : null;
              const diff = sollMinutes != null ? ist - sollMinutes : null;
              return (
                <tr key={employee.id} className="border-t border-brand-border">
                  <td className="py-1.5 pr-3 text-brand-text">{employee.name}</td>
                  <td className="py-1.5 pr-3 text-brand-text-muted">{formatHours(ist)}</td>
                  <td className="py-1.5 pr-3 text-brand-text-muted">
                    {sollMinutes != null ? formatHours(sollMinutes) : "–"}
                  </td>
                  <td
                    className={`py-1.5 font-medium ${
                      diff == null
                        ? "text-brand-text-muted"
                        : diff < 0
                          ? "text-amber-600 dark:text-amber-400"
                          : diff > 0
                            ? "text-brand-accent"
                            : "text-brand-text-muted"
                    }`}
                  >
                    {diff != null ? `${diff > 0 ? "+" : ""}${formatHours(diff)}` : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateAbsenceForm({
  employees,
  onSuccess,
  onError,
}: {
  employees: Employee[];
  onSuccess: () => void;
  onError: (err: unknown) => void;
}) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [type, setType] = useState<AbsenceType>("URLAUB");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const createAbsence = trpc.operator.createAbsence.useMutation({
    onSuccess: () => {
      setStartDate("");
      setEndDate("");
      setNote("");
      onSuccess();
    },
    onError,
  });

  if (employees.length === 0) {
    return (
      <p className="text-xs text-brand-text-muted">
        Erst im Personal-Bereich ein Teammitglied anlegen, bevor ihr Abwesenheiten eintragt.
      </p>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!employeeId || !startDate || !endDate) return;
        createAbsence.mutate({
          employeeId,
          type,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          note: note.trim() || undefined,
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
        Teammitglied
        <select
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          className="rounded-brand-md border border-brand-border px-2 py-1.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
        Art
        <select
          value={type}
          onChange={(event) => setType(event.target.value as AbsenceType)}
          className="rounded-brand-md border border-brand-border px-2 py-1.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {(Object.keys(ABSENCE_TYPE_LABELS) as AbsenceType[]).map((value) => (
            <option key={value} value={value}>
              {ABSENCE_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
        Von
        <input
          type="date"
          required
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="rounded-brand-md border border-brand-border px-2 py-1.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-brand-text-muted">
        Bis
        <input
          type="date"
          required
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="rounded-brand-md border border-brand-border px-2 py-1.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>
      <label className="flex min-w-[8rem] flex-1 flex-col gap-1 text-xs text-brand-text-muted">
        Notiz (optional)
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="rounded-brand-md border border-brand-border px-2 py-1.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>
      <button
        type="submit"
        disabled={createAbsence.isPending}
        className="rounded-brand-md bg-brand-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {createAbsence.isPending ? "…" : "Eintragen"}
      </button>
    </form>
  );
}

function AbsenceManager({ employees }: { employees: Employee[] }) {
  const utils = trpc.useUtils();
  // Fest gewähltes, weites Fenster statt der aktuell angezeigten Kalenderwoche
  // - offene Anfragen und geplante Abwesenheiten sollen hier auch dann
  // auftauchen, wenn man gerade eine andere Woche im Kalender oben ansieht.
  // useState-Lazy-Init statt `new Date()` direkt im Render, damit der
  // Query-Key über Re-Renders stabil bleibt.
  const [range] = useState(() => ({
    from: addDays(new Date(), -90).toISOString(),
    to: addDays(new Date(), 365).toISOString(),
  }));
  const absences = trpc.operator.absences.useQuery(range);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => utils.operator.absences.invalidate();
  const decideAbsence = trpc.operator.decideAbsence.useMutation({
    onSuccess: invalidate,
    onError: (err) => setError(err.message),
  });

  const pending = (absences.data ?? []).filter((absence) => absence.status === "AUSSTEHEND");

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border p-4">
      <div>
        <h4 className="text-sm font-semibold text-brand-heading">Abwesenheiten</h4>
        <p className="mt-1 text-xs text-brand-text-muted">
          Urlaub, Krankheit oder Sonstiges eintragen - genehmigte Abwesenheiten werden im Kalender
          oben geblockt angezeigt.
        </p>
      </div>

      <CreateAbsenceForm
        employees={employees}
        onSuccess={invalidate}
        onError={(err) =>
          setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.")
        }
      />

      {pending.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-brand-border pt-3">
          <p className="text-xs font-semibold text-brand-text-muted">
            Offene Anfragen ({pending.length})
          </p>
          {pending.map((absence) => (
            <div
              key={absence.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-brand-md border border-brand-border p-2 text-xs"
            >
              <div>
                <span className="font-medium text-brand-text">{absence.employee.name}</span>
                <span className="ml-2 text-brand-text-muted">
                  {ABSENCE_TYPE_LABELS[absence.type]} ·{" "}
                  {new Intl.DateTimeFormat("de-DE").format(new Date(absence.startDate))}
                  {toDateKey(absence.startDate) !== toDateKey(absence.endDate)
                    ? ` – ${new Intl.DateTimeFormat("de-DE").format(new Date(absence.endDate))}`
                    : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={decideAbsence.isPending}
                  onClick={() =>
                    decideAbsence.mutate({ absenceId: absence.id, status: "GENEHMIGT" })
                  }
                  className="rounded-brand-md bg-brand-accent px-2.5 py-1 font-semibold text-white disabled:opacity-50"
                >
                  Genehmigen
                </button>
                <button
                  type="button"
                  disabled={decideAbsence.isPending}
                  onClick={() =>
                    decideAbsence.mutate({ absenceId: absence.id, status: "ABGELEHNT" })
                  }
                  className="rounded-brand-md border border-brand-border px-2.5 py-1 text-brand-text disabled:opacity-50"
                >
                  Ablehnen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// --- top level --------------------------------------------------------

export function DienstplanCalendar({ readOnly = false }: { readOnly?: boolean }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [modal, setModal] = useState<ModalState | null>(null);
  const days = weekDays(weekStart);
  const rangeEnd = addDays(weekStart, 7);

  const employees = trpc.operator.employees.useQuery(undefined, { enabled: !readOnly });
  const shifts = trpc.operator.shifts.useQuery({
    from: weekStart.toISOString(),
    to: rangeEnd.toISOString(),
  });
  const appointments = trpc.operator.appointments.useQuery({
    from: weekStart.toISOString(),
    to: rangeEnd.toISOString(),
  });
  const absences = trpc.operator.absences.useQuery({
    from: weekStart.toISOString(),
    to: rangeEnd.toISOString(),
  });

  const shiftsByDay = new Map<string, Shift[]>();
  for (const shift of shifts.data ?? []) {
    const key = toDateKey(shift.date);
    shiftsByDay.set(key, [...(shiftsByDay.get(key) ?? []), shift]);
    if (minutesFromMidnight(shift.endTime) <= minutesFromMidnight(shift.startTime)) {
      const nextKey = toDateKey(addDays(new Date(shift.date), 1));
      shiftsByDay.set(nextKey, [...(shiftsByDay.get(nextKey) ?? []), shift]);
    }
  }
  const appointmentsByDay = new Map<string, Appointment[]>();
  for (const appointment of appointments.data ?? []) {
    const key = toDateKey(appointment.date);
    appointmentsByDay.set(key, [...(appointmentsByDay.get(key) ?? []), appointment]);
  }

  const isLoading =
    shifts.isLoading ||
    appointments.isLoading ||
    absences.isLoading ||
    (!readOnly && employees.isLoading);

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-4 sm:p-6">
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

      {isLoading ? (
        <p className="text-sm text-brand-text-muted">Lädt…</p>
      ) : (
        <>
          <WeekGrid
            days={days}
            shiftsByDay={shiftsByDay}
            appointmentsByDay={appointmentsByDay}
            absences={absences.data ?? []}
            readOnly={readOnly}
            onAddShift={(day, startTime) => setModal({ kind: "shift", date: day, startTime })}
            onQuickAddShift={(day) => setModal({ kind: "shift", date: day })}
            onSelectShift={(day, shift) =>
              setModal(
                readOnly
                  ? { kind: "view-shift", date: day, shift }
                  : { kind: "shift", date: day, shift },
              )
            }
            onSelectAppointment={(day, appointment) =>
              setModal(
                readOnly
                  ? { kind: "view-appointment", date: day, appointment }
                  : { kind: "appointment", date: day, appointment },
              )
            }
            onSelectAbsence={(absence) =>
              setModal({ kind: "view-absence", date: new Date(absence.startDate), absence })
            }
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
            {days.map((day) => {
              const key = toDateKey(day);
              return (
                <AgendaDay
                  key={key}
                  date={day}
                  shifts={shiftsByDay.get(key) ?? []}
                  appointments={appointmentsByDay.get(key) ?? []}
                  absences={absences.data ?? []}
                  readOnly={readOnly}
                  onAddShift={() => setModal({ kind: "shift", date: day })}
                  onAddAppointment={() => setModal({ kind: "appointment", date: day })}
                  onSelectShift={(shift) =>
                    setModal(
                      readOnly
                        ? { kind: "view-shift", date: day, shift }
                        : { kind: "shift", date: day, shift },
                    )
                  }
                  onSelectAppointment={(appointment) =>
                    setModal(
                      readOnly
                        ? { kind: "view-appointment", date: day, appointment }
                        : { kind: "appointment", date: day, appointment },
                    )
                  }
                  onSelectAbsence={(absence) =>
                    setModal({ kind: "view-absence", date: new Date(absence.startDate), absence })
                  }
                />
              );
            })}
          </div>

          {!readOnly && (
            <p className="text-xs text-brand-text-muted md:hidden">
              Tipp: auf einem größeren Bildschirm gibt es eine Stunden-für-Stunde-Ansicht der ganzen
              Woche.
            </p>
          )}
        </>
      )}

      {!readOnly && <SollIstPanel employees={employees.data ?? []} shifts={shifts.data ?? []} />}

      {!readOnly && <AbsenceManager employees={employees.data ?? []} />}

      {modal && (
        <DayModal
          state={modal}
          employees={employees.data ?? []}
          readOnly={readOnly}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
