import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

export function LoginPage() {
  const { login, verifyTwoFactor } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="app-drag-region flex h-screen w-screen items-center justify-center bg-canvas">
      <form
        className="app-no-drag w-full max-w-sm rounded-xl2 border border-hairline bg-canvas-panel p-8 shadow-md"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setSubmitting(true);
          try {
            if (challengeToken) {
              await verifyTwoFactor(challengeToken, code.trim());
              return;
            }
            const result = await login(email.trim(), password);
            if (result.twoFactorRequired) {
              setChallengeToken(result.challengeToken);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
          woodaa für Einrichtungen
        </p>
        <h1 className="mt-1 text-xl font-semibold text-ink-900">
          {challengeToken ? "Bestätigungscode" : "Anmelden"}
        </h1>

        {challengeToken ? (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-ink-500">
              Gib den 6-stelligen Code aus deiner Authenticator-App ein, oder verwende einen deiner
              Wiederherstellungscodes.
            </p>
            <label className="flex flex-col gap-1.5 text-sm text-ink-700">
              Code
              <input
                autoFocus
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="rounded-xl2 border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow duration-250 focus:border-accentScale-500 focus:shadow-xs"
              />
            </label>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-ink-700">
              E-Mail
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-xl2 border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow duration-250 focus:border-accentScale-500 focus:shadow-xs"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-ink-700">
              Passwort
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-xl2 border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow duration-250 focus:border-accentScale-500 focus:shadow-xs"
              />
            </label>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-xl2 bg-accentScale-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-250 ease-out-quart hover:bg-accentScale-600 disabled:opacity-50"
        >
          {submitting ? "Einen Moment…" : challengeToken ? "Bestätigen" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
