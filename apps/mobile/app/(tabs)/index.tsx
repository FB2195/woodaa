import type { BookingType } from "@woodaa/validators";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { FacilityCard } from "@/components/FacilityCard";
import { SelectField } from "@/components/SelectField";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { sortOptions } from "@/lib/sortLabels";
import { trpc } from "@/lib/trpc";

export default function SearchScreen() {
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState("");
  const [bookingType, setBookingType] = useState<BookingType | null>(null);
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("newest");

  const search = trpc.facility.list.useQuery({
    city: city || undefined,
    bookingType: bookingType ?? undefined,
    sort,
  });

  return (
    <View className="flex-1 bg-brand-background">
      <View className="gap-3 border-b border-brand-border bg-brand-surface px-6 pb-4 pt-4">
        <Text className="text-xl font-bold text-brand-primary-dark">Pflegeplatz finden</Text>

        <View className="flex-row gap-2">
          <TextInput
            value={cityInput}
            onChangeText={setCityInput}
            onSubmitEditing={() => setCity(cityInput.trim())}
            placeholder="Ort oder PLZ"
            placeholderTextColor="#6B6F62"
            returnKeyType="search"
            className="flex-1 rounded-brand-md border border-brand-border bg-brand-background px-3 py-2.5 text-base text-brand-text"
          />
          <Pressable
            onPress={() => setCity(cityInput.trim())}
            className="items-center justify-center rounded-brand-md bg-brand-accent px-4"
          >
            <Text className="font-semibold text-white">Suchen</Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setBookingType(null)}
            className={`rounded-brand-full border px-3 py-1.5 ${
              bookingType === null
                ? "border-brand-accent bg-brand-accent"
                : "border-brand-border bg-brand-background"
            }`}
          >
            <Text
              className={`text-xs font-medium ${bookingType === null ? "text-white" : "text-brand-text"}`}
            >
              Alle
            </Text>
          </Pressable>
          {bookingTypeOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setBookingType(option.value)}
              className={`rounded-brand-full border px-3 py-1.5 ${
                bookingType === option.value
                  ? "border-brand-accent bg-brand-accent"
                  : "border-brand-border bg-brand-background"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  bookingType === option.value ? "text-white" : "text-brand-text"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <SelectField label="Sortierung" value={sort} options={sortOptions} onChange={setSort} />
      </View>

      {search.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2F7D4F" />
        </View>
      ) : (
        <FlatList
          data={search.data?.results ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-6"
          ListHeaderComponent={
            search.data ? (
              <Text className="mb-3 text-sm text-brand-text-muted">
                {search.data.totalCount} Treffer
                {search.data.usedFallbackRadius ? " in der Umgebung" : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Text className="pt-10 text-center text-sm text-brand-text-muted">
              Keine Einrichtungen gefunden.
            </Text>
          }
          renderItem={({ item }) => (
            <FacilityCard
              facility={item}
              onPress={() => router.push(`/einrichtung/${item.slug}`)}
            />
          )}
        />
      )}
    </View>
  );
}
