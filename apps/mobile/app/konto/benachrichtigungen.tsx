import { Stack } from "expo-router";
import { ActivityIndicator, ScrollView, Switch, Text, View } from "react-native";
import { trpc } from "@/lib/trpc";

const TOGGLES = [
  {
    key: "notifyMessagesEmail" as const,
    label: "Neue Nachrichten von Einrichtungen per E-Mail",
  },
  {
    key: "notifyMessagesPush" as const,
    label: "Neue Nachrichten von Einrichtungen per Push",
  },
  {
    key: "notifySavedSearchEmail" as const,
    label: "Benachrichtigungen zu gespeicherten Suchen per E-Mail",
  },
];

// Mobile port of apps/web/app/konto/benachrichtigungen +
// NotificationPreferencesForm.tsx - same autosave-per-toggle pattern.
export default function BenachrichtigungenScreen() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.account.notificationPreferences.useQuery();
  const update = trpc.account.updateNotificationPreferences.useMutation({
    onSuccess: () => utils.account.notificationPreferences.invalidate(),
  });

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 p-6"
    >
      <Stack.Screen options={{ title: "Benachrichtigungen" }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Bestätigungen zu deinen Buchungen (z. B. dass eine Buchung bestätigt wurde) und
        sicherheitsrelevante E-Mails (z. B. Passwort zurücksetzen) erhältst du immer - das lässt
        sich hier nicht abschalten. Die folgenden Benachrichtigungen sind optional:
      </Text>

      {isLoading || !data ? (
        <View className="items-center py-8">
          <ActivityIndicator color="#2F7D4F" />
        </View>
      ) : (
        <View className="gap-1 rounded-brand-lg border border-brand-border bg-brand-surface p-2 dark:border-brand-border-dark dark:bg-brand-surface-dark">
          {TOGGLES.map(({ key, label }) => (
            <View key={key} className="flex-row items-center justify-between gap-3 px-2 py-3">
              <Text className="flex-1 text-sm text-brand-text dark:text-brand-text-dark">
                {label}
              </Text>
              <Switch
                value={data[key]}
                disabled={update.isPending}
                onValueChange={(value) => update.mutate({ [key]: value })}
                trackColor={{ true: "#2F7D4F" }}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
