import { router, Stack } from "expo-router";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { FacilityCard } from "@/components/FacilityCard";
import { trpc } from "@/lib/trpc";

export default function FavoritenScreen() {
  const favoritesQuery = trpc.favorite.list.useQuery();

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
        <FacilityCard facility={item} onPress={() => router.push(`/einrichtung/${item.slug}`)} />
      )}
      />
    </>
  );
}
