import type { ReactNode } from "react";

export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 p-6">
      <button
        type="button"
        aria-label="Schließen"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative w-full max-w-md rounded-xl2 border border-hairline bg-canvas-panel p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-ink-400 transition-colors duration-250 hover:bg-canvas hover:text-ink-900"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
