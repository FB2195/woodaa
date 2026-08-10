import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { trpc } from "@/lib/trpc";

type ChatMessage = { role: "user" | "assistant"; content: string };

// Mobile port of apps/web/components/support/AIChatWidget.tsx.
export function AIChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hallo! Ich bin der woodaa-Chat. Wie kann ich dir helfen?" },
  ]);
  const [input, setInput] = useState("");
  const chat = trpc.support.chat.useMutation();

  async function send() {
    const text = input.trim();
    if (!text || chat.isPending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");

    try {
      const { reply } = await chat.mutateAsync({ messages: nextMessages });
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Da ist etwas schiefgelaufen. Nutze gerne den Rückruf oder das Kontaktformular.",
        },
      ]);
    }
  }

  return (
    <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <View className="gap-3">
        {messages.map((message, i) => (
          <View
            key={i}
            className={`max-w-[85%] rounded-brand-md px-3 py-2 ${
              message.role === "user" ? "self-end bg-brand-accent" : "self-start bg-brand-background dark:bg-brand-background-dark"
            }`}
          >
            <Text
              className={`text-sm ${message.role === "user" ? "text-white" : "text-brand-text dark:text-brand-text-dark"}`}
            >
              {message.content}
            </Text>
          </View>
        ))}
        {chat.isPending && (
          <View className="self-start rounded-brand-md bg-brand-background px-3 py-2 dark:bg-brand-background-dark">
            <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
              Schreibt…
            </Text>
          </View>
        )}
      </View>

      <View className="mt-3 flex-row gap-2">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Frag den woodaa-Chat…"
          className="flex-1 rounded-brand-md border border-brand-border px-3 py-2 text-sm text-brand-text dark:border-brand-border-dark dark:text-brand-text-dark"
        />
        <Pressable
          disabled={chat.isPending || !input.trim()}
          onPress={send}
          className={`items-center justify-center rounded-brand-md bg-brand-accent px-4 py-2 ${chat.isPending || !input.trim() ? "opacity-50" : ""}`}
        >
          <Text className="text-sm font-semibold text-white">Senden</Text>
        </Pressable>
      </View>
    </View>
  );
}
