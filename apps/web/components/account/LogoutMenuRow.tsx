"use client";

import { LogOutIcon } from "@/components/account/icons";
import { useLogout } from "@/lib/useLogout";

export function LogoutMenuRow({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { logout, loggingOut } = useLogout();

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loggingOut}
      className="flex w-full items-center gap-3 border-b border-brand-border px-4 py-4 text-left text-sm font-medium text-red-600 last:border-b-0 hover:bg-brand-background disabled:opacity-60 dark:text-red-400"
    >
      <span className="text-red-500 dark:text-red-400">
        <LogOutIcon />
      </span>
      {loggingOut ? loadingLabel : label}
    </button>
  );
}
