"use client";

import { trpc } from "@/lib/trpc";

const TOGGLES = [
  {
    key: "notifyMessagesEmail" as const,
    label: "Neue Nachrichten von Einrichtungen per E-Mail",
  },
  {
    key: "notifyMessagesPush" as const,
    label: "Neue Nachrichten von Einrichtungen per Push (App)",
  },
  {
    key: "notifySavedSearchEmail" as const,
    label: "Benachrichtigungen zu gespeicherten Suchen per E-Mail",
  },
];

// Autosave on every toggle, same pattern as SensitivePersonalData.tsx's
// pflegegradAntragLaeuft checkbox - no separate submit button.
export function NotificationPreferencesForm() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.account.notificationPreferences.useQuery();
  const update = trpc.account.updateNotificationPreferences.useMutation({
    onSuccess: () => utils.account.notificationPreferences.invalidate(),
  });

  if (isLoading || !data) return null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-brand-text-muted">
        Bestätigungen zu deinen Buchungen (z. B. dass eine Buchung bestätigt wurde) und
        sicherheitsrelevante E-Mails (z. B. Passwort zurücksetzen) erhältst du immer - das lässt
        sich hier nicht abschalten. Die folgenden Benachrichtigungen sind optional:
      </p>

      <div className="flex flex-col gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-6">
        {TOGGLES.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={data[key]}
              disabled={update.isPending}
              onChange={(event) => update.mutate({ [key]: event.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
