import { useAuth } from "../lib/AuthContext";

export function UnsupportedRolePage() {
  const { logout } = useAuth();

  return (
    <div className="app-drag-region flex h-screen w-screen items-center justify-center bg-canvas">
      <div className="app-no-drag max-w-sm rounded-xl2 border border-hairline bg-canvas-panel p-8 text-center shadow-md">
        <h1 className="text-lg font-semibold text-ink-900">Kein Betreiber-Konto</h1>
        <p className="mt-2 text-sm text-ink-500">
          Dieses Programm ist für Einrichtungsbetreiber:innen gedacht. Melde dich mit deinem
          Betreiber-Konto an, oder nutze für andere Konten die Website.
        </p>
        <button
          type="button"
          onClick={() => logout()}
          className="mt-6 rounded-xl2 border border-hairline px-4 py-2 text-sm font-medium text-ink-700 transition-colors duration-250 hover:bg-canvas"
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}
