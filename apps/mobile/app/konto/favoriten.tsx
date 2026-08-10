import { router, Stack } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { FacilityCard } from "@/components/FacilityCard";
import { trpc } from "@/lib/trpc";

export default function FavoritenScreen() {
  const utils = trpc.useUtils();
  const favoritesQuery = trpc.favorite.list.useQuery();
  const toggle = trpc.favorite.toggle.useMutation({
    onSuccess: () => utils.favorite.list.invalidate(),
  });

  if (favoritesQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Favoriten" }} />
      <FlatList
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="p-6"
      data={favoritesQuery.data ?? []}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Text className="pt-10 text-center text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Noch keine Favoriten gespeichert.
        </Text>
      }
      renderItem={({ item }) => (
        <View>
          <FacilityCard facility={item} onPress={() => router.push(`/einrichtung/${item.slug}`)} />
          <Pressable
            onPress={() => toggle.mutate({ facilityId: item.id })}
            className="-mt-3 mb-4 self-end px-1"
          >
            <Text className="text-xs font-medium text-brand-text-muted dark:text-brand-text-muted-dark">
              Entfernen
            </Text>
          </Pressable>
        </View>
      )}
      />
    </>
  );
}
