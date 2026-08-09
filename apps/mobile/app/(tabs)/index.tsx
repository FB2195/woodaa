import type { BookingType, Weekday } from "@woodaa/validators";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { DateField } from "@/components/DateField";
import { FacilityCard } from "@/components/FacilityCard";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { SelectField } from "@/components/SelectField";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { sortOptions } from "@/lib/sortLabels";
import { trpc } from "@/lib/trpc";

const radiusOptions = [
  { value: 10, label: "10 km Umkreis" },
  { value: 25, label: "25 km Umkreis" },
  { value: 50, label: "50 km Umkreis" },
  { value: 100, label: "100 km Umkreis" },
];

const weekdayOptions: { value: Weekday; label: string }[] = [
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
  { value: 7, label: "So" },
];

export default function SearchScreen() {
  const { colorScheme } = useColorScheme();
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState("");
  const [bookingType, setBookingType] = useState<BookingType | null>(null);
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState("");
  const [pflegegrad, setPflegegrad] = useState<(typeof pflegegradOptions)[number]["value"] | null>(
    null,
  );
  const [availableFromDate, setAvailableFromDate] = useState<Date | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [weekdays, setWeekdays] = useState<Weekday[]>([]);
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  function toggleWeekday(day: Weekday) {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
    );
  }

  const maxPriceNumber = Number(maxPrice);
  const hoursPerDayNumber = Number(hoursPerDay);

  const search = trpc.facility.list.useQuery({
    city: city || undefined,
    bookingType: bookingType ?? undefined,
    sort,
    radiusKm: radiusKm ?? undefined,
    maxPriceCents:
      maxPrice.trim() && Number.isFinite(maxPriceNumber)
        ? Math.round(maxPriceNumber * 100)
        : undefined,
    pflegegrad: pflegegrad ?? undefined,
    availableFromDate:
      bookingType === "STATIONAERE_AUFNAHME" ? (availableFromDate ?? undefined) : undefined,
    rangeStart: bookingType === "KURZZEITPFLEGE" ? (rangeStart ?? undefined) : undefined,
    rangeEnd: bookingType === "KURZZEITPFLEGE" ? (rangeEnd ?? undefined) : undefined,
    weekdays:
      (bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") && weekdays.length
        ? weekdays
        : undefined,
    hoursPerDay:
      (bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") &&
      hoursPerDay.trim() &&
      Number.isFinite(hoursPerDayNumber)
        ? hoursPerDayNumber
        : undefined,
    onlyAvailable,
  });

  return (
    <View className="flex-1 bg-brand-background dark:bg-brand-background-dark">
      <View className="gap-3 border-b border-brand-border bg-brand-surface px-6 pb-4 pt-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <Text className="text-xl font-bold text-brand-primary-dark dark:text-brand-heading-dark">
          Pflegeplatz finden
        </Text>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <LocationAutocomplete
              value={cityInput}
              onChange={setCityInput}
              placeholder="Stadt oder PLZ, z. B. Berlin"
            />
          </View>
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
                : "border-brand-border bg-brand-background dark:border-brand-border-dark dark:bg-brand-background-dark"
            }`}
          >
            <Text
              className={`text-xs font-medium ${bookingType === null ? "text-white" : "text-brand-text dark:text-brand-text-dark"}`}
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
                  : "border-brand-border bg-brand-background dark:border-brand-border-dark dark:bg-brand-background-dark"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  bookingType === option.value
                    ? "text-white"
                    : "text-brand-text dark:text-brand-text-dark"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {bookingType === "STATIONAERE_AUFNAHME" && (
          <DateField label="Verfügbar ab" value={availableFromDate} onChange={setAvailableFromDate} />
        )}

        {bookingType === "KURZZEITPFLEGE" && (
          <View className="flex-row gap-2">
            <View className="flex-1">
              <DateField label="Von" value={rangeStart} onChange={setRangeStart} />
            </View>
            <View className="flex-1">
              <DateField label="Bis" value={rangeEnd} onChange={setRangeEnd} minimumDate={rangeStart ?? undefined} />
            </View>
          </View>
        )}

        {(bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") && (
          <View className="gap-2">
            <View className="flex-row flex-wrap gap-1.5">
              {weekdayOptions.map((day) => (
                <Pressable
                  key={day.value}
                  onPress={() => toggleWeekday(day.value)}
                  className={`rounded-brand-full border px-3 py-1.5 ${
                    weekdays.includes(day.value)
                      ? "border-brand-accent bg-brand-accent"
                      : "border-brand-border bg-brand-background dark:border-brand-border-dark dark:bg-brand-background-dark"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      weekdays.includes(day.value)
                        ? "text-white"
                        : "text-brand-text dark:text-brand-text-dark"
                    }`}
                  >
                    {day.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={hoursPerDay}
              onChangeText={setHoursPerDay}
              keyboardType="number-pad"
              placeholder="Stunden pro Tag"
              placeholderTextColor={colorScheme === "dark" ? "#B7C2A8" : "#6B6F62"}
              className="rounded-brand-md border border-brand-border bg-brand-background px-3 py-2.5 text-base text-brand-text dark:border-brand-border-dark dark:bg-brand-background-dark dark:text-brand-text-dark"
            />
          </View>
        )}

        {bookingType !== null && (
          <Pressable
            onPress={() => setOnlyAvailable((v) => !v)}
            className="flex-row items-center gap-2"
          >
            <View
              className={`h-5 w-5 items-center justify-center rounded-brand-sm border ${
                onlyAvailable
                  ? "border-brand-accent bg-brand-accent"
                  : "border-brand-border bg-brand-background dark:border-brand-border-dark dark:bg-brand-background-dark"
              }`}
            >
              {onlyAvailable && <Text className="text-xs font-bold text-white">✓</Text>}
            </View>
            <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
              Nur freie Pflegeplätze anzeigen
            </Text>
          </Pressable>
        )}

        <Pressable onPress={() => setShowFilters((v) => !v)}>
          <Text className="text-sm font-medium text-brand-accent">
            {showFilters ? "Weniger Filter" : "Mehr Filter"}
          </Text>
        </Pressable>

        {showFilters && (
          <View className="gap-3">
            <SelectField
              label="Umkreis"
              value={radiusKm}
              options={radiusOptions}
              placeholder="Beliebige Entfernung"
              onChange={setRadiusKm}
            />
            <View className="gap-1">
              <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                Max. Preis (€/Monat)
              </Text>
              <TextInput
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="number-pad"
                placeholder="z. B. 3000"
                placeholderTextColor={colorScheme === "dark" ? "#B7C2A8" : "#6B6F62"}
                className="rounded-brand-md border border-brand-border bg-brand-background px-3 py-2.5 text-base text-brand-text dark:border-brand-border-dark dark:bg-brand-background-dark dark:text-brand-text-dark"
              />
            </View>
            <SelectField
              label="Pflegegrad"
              value={pflegegrad}
              options={pflegegradOptions.filter((option) => option.value > 0)}
              placeholder="Jeder Pflegegrad"
              onChange={setPflegegrad}
            />
            <SelectField label="Sortierung" value={sort} options={sortOptions} onChange={setSort} />
          </View>
        )}
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
              <Text className="mb-3 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                {search.data.totalCount} Treffer
                {search.data.usedFallbackRadius ? " in der Umgebung" : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Text className="pt-10 text-center text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
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
