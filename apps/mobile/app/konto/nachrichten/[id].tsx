import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/components/account/ConversationThreadView.tsx -
// same bubble styling as AIChatWidget.tsx for visual consistency across the
// app's two chat-like surfaces.
export default function NachrichtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();
  const { data: conversation, isLoading } = trpc.message.conversation.useQuery({
    conversationId: id,
  });
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const send = trpc.message.send.useMutation();
  const markRead = trpc.message.markRead.useMutation();
  const markedReadFor = useRef<string | null>(null);

  useEffect(() => {
    if (!id || markedReadFor.current === id) return;
    markedReadFor.current = id;
    markRead.mutate({ conversationId: id });
    // markRead is a stable-enough mutation object (see AuthContext's similar
    // comment) - only id should re-trigger this.
  }, [id]);

  async function handleSend() {
    const value = body.trim();
    if (!value || !conversation) return;
    setError(null);
    try {
      await send.mutateAsync({ facilityId: conversation.facilityId, body: value });
      setBody("");
      await utils.message.conversation.invalidate({ conversationId: id });
      await utils.message.myConversations.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: conversation?.facility.name ?? "Nachrichten" }} />
      {isLoading || !conversation ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2F7D4F" />
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-3 p-6"
            keyboardDismissMode="on-drag"
          >
            {conversation.messages.map((message) => (
              <View
                key={message.id}
                className={`max-w-[85%] rounded-brand-md px-3 py-2 ${
                  message.senderIsFacility
                    ? "self-start bg-brand-background dark:bg-brand-background-dark"
                    : "self-end bg-brand-accent"
                }`}
              >
                <Text
                  className={`text-sm ${
                    message.senderIsFacility
                      ? "text-brand-text dark:text-brand-text-dark"
                      : "text-white"
                  }`}
                >
                  {message.body}
                </Text>
                <Text
                  className={`mt-1 text-xs ${
                    message.senderIsFacility
                      ? "text-brand-text-muted dark:text-brand-text-muted-dark"
                      : "text-white/70"
                  }`}
                >
                  {formatDateTime(message.createdAt)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View className="flex-row gap-2 border-t border-brand-border p-4 dark:border-brand-border-dark">
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Nachricht schreiben…"
              className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text dark:border-brand-border-dark dark:text-brand-text-dark"
            />
            <Pressable
              disabled={send.isPending || !body.trim()}
              onPress={handleSend}
              className={`active:opacity-70 items-center justify-center rounded-brand-md bg-brand-accent px-4 py-2 ${
                send.isPending || !body.trim() ? "opacity-50" : ""
              }`}
            >
              <Text className="text-sm font-semibold text-white">
                {send.isPending ? "…" : "Senden"}
              </Text>
            </Pressable>
          </View>
          {error && <Text className="px-4 pb-2 text-sm text-red-600">{error}</Text>}
        </>
      )}
    </KeyboardAvoidingView>
  );
}
