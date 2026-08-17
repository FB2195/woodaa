import { router, Stack } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/app/konto/nachrichten + MyConversationsSection -
// see that pair for the feature's design rationale.
export default function NachrichtenScreen() {
  const { data, isLoading } = trpc.message.myConversations.useQuery();

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-3 p-6"
    >
      <Stack.Screen options={{ title: "Nachrichten" }} />
      {isLoading || !data ? (
        <View className="items-center py-8">
          <ActivityIndicator color="#2F7D4F" />
        </View>
      ) : data.length === 0 ? (
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Du hast noch keine Einrichtung über woodaa kontaktiert. Auf einer Einrichtungsseite
          findest du den Button „Frage stellen".
        </Text>
      ) : (
        data.map((conversation) => (
          <Pressable
            key={conversation.id}
            onPress={() => router.push(`/konto/nachrichten/${conversation.id}`)}
            className="active:opacity-70 flex-row items-center gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark"
          >
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  numberOfLines={1}
                  className="flex-1 font-semibold text-brand-heading dark:text-brand-heading-dark"
                >
                  {conversation.facility.name}
                </Text>
                {conversation.unread && (
                  <View className="h-2 w-2 shrink-0 rounded-full bg-brand-accent" />
                )}
              </View>
              {conversation.lastMessage && (
                <Text
                  numberOfLines={1}
                  className={`mt-1 text-sm ${
                    conversation.unread
                      ? "font-medium text-brand-text dark:text-brand-text-dark"
                      : "text-brand-text-muted dark:text-brand-text-muted-dark"
                  }`}
                >
                  {conversation.lastMessage.senderIsFacility ? "" : "Du: "}
                  {conversation.lastMessage.body}
                </Text>
              )}
              <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                {formatDateTime(conversation.lastMessageAt)}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
