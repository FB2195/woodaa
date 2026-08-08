import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const inputClassName =
  "rounded-xl2 border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow duration-250 focus:border-accentScale-500 focus:shadow-xs";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink-700">
      {label}
      {children}
    </label>
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClassName} />;
}

export function SelectFieldInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputClassName} />;
}
