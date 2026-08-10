"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

// "Team" area (apps/desktop) - a plain per-facility to-do list, not tied to
// a specific shift/person. See FacilityTask in schema.prisma.
export function TeamTasks() {
  const utils = trpc.useUtils();
  const tasks = trpc.operator.tasks.useQuery();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addTask = trpc.operator.addTask.useMutation({
    onSuccess: () => {
      setTitle("");
      void utils.operator.tasks.invalidate();
    },
  });
  const toggleTask = trpc.operator.toggleTask.useMutation({
    onSuccess: () => void utils.operator.tasks.invalidate(),
  });
  const removeTask = trpc.operator.removeTask.useMutation({
    onSuccess: () => void utils.operator.tasks.invalidate(),
  });

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  const open = tasks.data?.filter((t) => !t.completedAt) ?? [];
  const done = tasks.data?.filter((t) => t.completedAt) ?? [];

  return (
    <div className="flex flex-col gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
      <div>
        <h3 className="font-semibold text-brand-heading">Aufgaben</h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Eine gemeinsame To-do-Liste für euer Team - z.B. für Dinge, die während der Schicht
          erledigt werden müssen.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = title.trim();
          if (!value) return;
          void run(() => addTask.mutateAsync({ title: value }));
        }}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Neue Aufgabe…"
          disabled={addTask.isPending}
          className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <button
          type="submit"
          disabled={addTask.isPending || !title.trim()}
          className="rounded-brand-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Hinzufügen
        </button>
      </form>

      {tasks.isLoading ? (
        <p className="text-sm text-brand-text-muted">Lädt…</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {open.length === 0 && done.length === 0 && (
            <p className="text-brand-text-muted">Noch keine Aufgaben - trag oben die erste ein.</p>
          )}
          {[...open, ...done].map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-brand-md border border-brand-border p-3"
            >
              <label className="flex flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(task.completedAt)}
                  disabled={toggleTask.isPending}
                  onChange={() => void run(() => toggleTask.mutateAsync({ taskId: task.id }))}
                />
                <span
                  className={
                    task.completedAt ? "text-brand-text-muted line-through" : "text-brand-text"
                  }
                >
                  {task.title}
                </span>
              </label>
              <button
                type="button"
                disabled={removeTask.isPending}
                onClick={() => void run(() => removeTask.mutateAsync({ taskId: task.id }))}
                aria-label={`"${task.title}" löschen`}
                className="text-brand-text-muted hover:text-red-600 disabled:opacity-50"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
