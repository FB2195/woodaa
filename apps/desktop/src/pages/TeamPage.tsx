import { useState } from "react";
import { formatDate } from "../lib/format";
import { trpc } from "../lib/trpc";

function TasksPanel() {
  const utils = trpc.useUtils();
  const tasksQuery = trpc.operator.tasks.useQuery();
  const addTask = trpc.operator.addTask.useMutation({
    onSuccess: () => utils.operator.tasks.invalidate(),
  });
  const toggleTask = trpc.operator.toggleTask.useMutation({
    onSuccess: () => utils.operator.tasks.invalidate(),
  });
  const removeTask = trpc.operator.removeTask.useMutation({
    onSuccess: () => utils.operator.tasks.invalidate(),
  });
  const [draft, setDraft] = useState("");

  return (
    <div className="rounded-xl2 border border-hairline bg-canvas-panel p-5">
      <h2 className="text-sm font-semibold text-ink-900">Aufgaben</h2>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          addTask.mutate({ title: draft.trim() }, { onSuccess: () => setDraft("") });
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Neue Aufgabe…"
          className="flex-1 rounded-xl2 border border-hairline bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition-shadow duration-250 focus:border-accentScale-500 focus:shadow-xs"
        />
        <button
          type="submit"
          disabled={addTask.isPending || !draft.trim()}
          className="shrink-0 rounded-xl2 bg-accentScale-500 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-250 ease-out-quart hover:bg-accentScale-600 disabled:opacity-50"
        >
          +
        </button>
      </form>

      <ul className="mt-4 space-y-1.5">
        {(tasksQuery.data ?? []).map((task) => (
          <li
            key={task.id}
            className="group flex items-center gap-2.5 rounded-brand-md px-2 py-1.5 hover:bg-canvas"
          >
            <button
              type="button"
              onClick={() => toggleTask.mutate({ taskId: task.id })}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-brand-sm border ${
                task.completedAt
                  ? "border-accentScale-500 bg-accentScale-500"
                  : "border-hairline-strong bg-canvas-panel"
              }`}
            >
              {task.completedAt && <span className="text-[10px] font-bold text-white">✓</span>}
            </button>
            <span
              className={`flex-1 text-sm ${
                task.completedAt ? "text-ink-300 line-through" : "text-ink-700"
              }`}
            >
              {task.title}
            </span>
            <button
              type="button"
              onClick={() => removeTask.mutate({ taskId: task.id })}
              className="shrink-0 text-xs text-ink-300 opacity-0 transition-opacity duration-250 hover:text-red-600 group-hover:opacity-100"
            >
              ✕
            </button>
          </li>
        ))}
        {tasksQuery.data?.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-ink-400">Keine offenen Aufgaben.</p>
        )}
      </ul>
    </div>
  );
}

function HandoverPanel() {
  const utils = trpc.useUtils();
  const notesQuery = trpc.operator.handoverNotes.useQuery();
  const addNote = trpc.operator.addHandoverNote.useMutation({
    onSuccess: () => utils.operator.handoverNotes.invalidate(),
  });
  const [draft, setDraft] = useState("");

  return (
    <div className="rounded-xl2 border border-hairline bg-canvas-panel p-5">
      <h2 className="text-sm font-semibold text-ink-900">Übergabe</h2>
      <p className="mt-0.5 text-xs text-ink-400">
        Chronologisches Protokoll für die nächste Schicht - nicht löschbar.
      </p>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          addNote.mutate({ body: draft.trim() }, { onSuccess: () => setDraft("") });
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Neuer Übergabe-Eintrag…"
          className="flex-1 rounded-xl2 border border-hairline bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition-shadow duration-250 focus:border-accentScale-500 focus:shadow-xs"
        />
        <button
          type="submit"
          disabled={addNote.isPending || !draft.trim()}
          className="shrink-0 rounded-xl2 bg-accentScale-500 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-250 ease-out-quart hover:bg-accentScale-600 disabled:opacity-50"
        >
          +
        </button>
      </form>

      <ul className="mt-4 space-y-3">
        {(notesQuery.data ?? []).map((note) => (
          <li key={note.id} className="rounded-brand-md bg-canvas px-3 py-2">
            <p className="text-sm text-ink-700">{note.body}</p>
            <p className="mt-0.5 text-[11px] text-ink-400">{formatDate(note.createdAt)}</p>
          </li>
        ))}
        {notesQuery.data?.length === 0 && (
          <p className="text-xs text-ink-400">Noch keine Übergabe-Einträge.</p>
        )}
      </ul>
    </div>
  );
}

export function TeamPage() {
  return (
    <div className="pt-8">
      <div className="app-no-drag">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Team</h1>
        <p className="mt-1 text-sm text-ink-500">
          Aufgaben und Übergabe-Protokoll für euer Team - keine Personendaten, keine Zuordnung zu
          einzelnen Mitarbeitenden.
        </p>
      </div>

      <div className="app-no-drag mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TasksPanel />
        <HandoverPanel />
      </div>
    </div>
  );
}
