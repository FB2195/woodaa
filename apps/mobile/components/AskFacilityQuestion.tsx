import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "@/lib/AuthContext";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/components/AskFacilityQuestion.tsx - see there
// for the feature's design rationale. Unlike the web version (which
// attempts the send first and redirects on a 401), mobile already knows
// whether a user is logged in via AuthContext, so it redirects up front.
export function AskFacilityQuestion({
  facilityId,
  facilityName,
}: {
  facilityId: string;
  facilityName: string;
}) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const send = trpc.message.send.useMutation();

  if (send.isSuccess) {
    return (
      <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <Text className="font-semibold text-brand-heading dark:text-brand-heading-dark">
          Frage gesendet
        </Text>
        <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Deine Nachricht an {facilityName} wurde verschickt. Die Antwort findest du unter
          Nachrichten in deinem Konto.
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <Text className="font-semibold text-brand-heading dark:text-brand-heading-dark">
        Frage an die Einrichtung
      </Text>
      <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Noch unsicher wegen eines freien Zimmers, Haustieren oder etwas anderem? Frag direkt bei{" "}
        {facilityName} nach - unverbindlich und ohne Buchung.
      </Text>
      <TextInput
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={3}
        placeholder="z. B. Ist aktuell ein Zimmer für Kurzzeitpflege frei?"
        className="mt-3 min-h-20 rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text dark:border-brand-border-dark dark:text-brand-text-dark"
      />
      <Pressable
        disabled={send.isPending || !body.trim()}
        onPress={() => {
          if (!user) {
            router.push("/login");
            return;
          }
          const value = body.trim();
          if (!value) return;
          setError(null);
          send.mutate({ facilityId, body: value }, { onError: (err) => setError(err.message) });
        }}
        className={`active:opacity-70 mt-3 self-start rounded-brand-md bg-brand-accent px-5 py-2 ${
          send.isPending || !body.trim() ? "opacity-50" : ""
        }`}
      >
        <Text className="text-sm font-semibold text-white">
          {send.isPending ? "Wird gesendet…" : "Frage senden"}
        </Text>
      </Pressable>
      {error && <Text className="mt-2 text-sm text-red-600">{error}</Text>}
    </View>
  );
}
