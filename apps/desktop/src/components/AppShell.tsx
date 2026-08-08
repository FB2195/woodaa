import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { trpc } from "../lib/trpc";

const navItems = [
  { to: "/", label: "Belegung", icon: "◧", enabled: true },
  { to: "/personal", label: "Personal", icon: "◈", enabled: false },
  { to: "/bewohner", label: "Bewohner:innen", icon: "◌", enabled: true },
  { to: "/team", label: "Team", icon: "◐", enabled: false },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const facility = trpc.operator.myFacility.useQuery();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      <aside className="flex w-64 shrink-0 flex-col border-r border-hairline bg-canvas-panel">
        <div className="app-drag-region flex h-11 items-center pl-20">
          <span className="text-sm font-semibold tracking-tight text-ink-900">woodaa</span>
        </div>

        <div className="border-b border-hairline px-5 pb-4">
          <p className="truncate text-sm font-medium text-ink-900">
            {facility.data?.name ?? "Meine Einrichtung"}
          </p>
          <p className="truncate text-xs text-ink-400">{facility.data?.city}</p>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) =>
            item.enabled ? (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl2 px-3 py-2 text-sm font-medium transition-colors duration-250 ease-out-quart ${
                    isActive
                      ? "bg-accentScale-50 text-accentScale-700"
                      : "text-ink-700 hover:bg-canvas"
                  }`
                }
                end
              >
                <span aria-hidden className="text-base leading-none">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            ) : (
              <div
                key={item.to}
                className="flex items-center justify-between gap-2.5 rounded-xl2 px-3 py-2 text-sm font-medium text-ink-300"
              >
                <span className="flex items-center gap-2.5">
                  <span aria-hidden className="text-base leading-none">
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-300">
                  Bald
                </span>
              </div>
            ),
          )}
        </nav>

        <div className="border-t border-hairline p-3">
          <div className="flex items-center justify-between gap-2 rounded-xl2 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-900">{user?.name}</p>
              <p className="truncate text-xs text-ink-400">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="shrink-0 text-xs font-medium text-ink-400 transition-colors duration-250 hover:text-ink-900"
            >
              Abmelden
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="app-drag-region h-11 w-full" />
        <div className="px-8 pb-10">{children}</div>
      </main>
    </div>
  );
}
