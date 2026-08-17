import type { BookingType, Weekday } from "@woodaa/validators";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { DateRangeCalendar } from "@/components/booking/DateRangeCalendar";
import { DateField } from "@/components/DateField";
import { FacilityCard } from "@/components/FacilityCard";
import { FacilityResultsMap } from "@/components/FacilityResultsMap";
import { buildPopularCities, HomeContent } from "@/components/home/HomeContent";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { SelectField } from "@/components/SelectField";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { googleMapsApiKey } from "@/lib/googleMapsConfig";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { sortOptions } from "@/lib/sortLabels";
import { trpc } from "@/lib/trpc";

// Subset of AMENITY_OPTIONS (@woodaa/validators) surfaced as a dedicated
// quick filter - the full amenity list isn't ported to mobile search yet
// (only used for display, see lib/amenityIcons.tsx), but accessibility is
// common enough to search for that it gets its own section.
const ACCESSIBILITY_AMENITIES = [
  "Barrierefreiheit",
  "Rollstuhlgerecht",
  "Barrierefreies Bad",
  "Aufzug vorhanden",
];

const radiusOptions = [
  { value: 10, label: "10 km Umkreis" },
  { value: 25, label: "25 km Umkreis" },
  { value: 50, label: "50 km Umkreis" },
  { value: 100, label: "100 km Umkreis" },
];

function formatShortDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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
  const [resultsView, setResultsView] = useState<"list" | "map">("list");
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState("");
  const [pflegegrad, setPflegegrad] = useState<(typeof pflegegradOptions)[number]["value"] | null>(
    null,
  );
  const [availableFromDate, setAvailableFromDate] = useState<Date | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [rangeCalendarOpen, setRangeCalendarOpen] = useState(true);
  const [weekdays, setWeekdays] = useState<Weekday[]>([]);
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [amenities, setAmenities] = useState<string[]>([]);

  function toggleAmenity(amenity: string) {
    setAmenities((current) =>
      current.includes(amenity) ? current.filter((a) => a !== amenity) : [...current, amenity],
    );
  }

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
    amenities: amenities.length ? amenities : undefined,
  });

  // Mirrors apps/web's separate "/" vs "/suche" split: before any filter is
  // engaged, this tab shows the landing content (see HomeContent) built
  // from the same unfiltered facility.list results instead of an empty
  // results list - the app only has room for Suche/Buchungen/Konto in the
  // bottom nav, so "land on a homepage" means the Suche tab starts here
  // rather than adding a 4th tab.
  const hasInteracted = city !== "" || bookingType !== null;

  // Collapse the advanced filter panel the moment results actually come
  // into view (not just on the Suchen button press - selecting a
  // Betreuungsart pill alone also triggers hasInteracted) - otherwise it
  // keeps eating screen space and results only show far down the page.
  useEffect(() => {
    if (hasInteracted) setShowFilters(false);
  }, [hasInteracted]);

  const allResults = search.data?.results ?? [];
  const popularCities = buildPopularCities(allResults);
  const cityCount = new Set(allResults.map((f) => f.city)).size;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="gap-3 border-b border-brand-border bg-brand-surface px-6 pb-4 pt-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <Text className="text-xl font-bold text-brand-primary-dark dark:text-brand-heading-dark">
          Pflegeplatz finden
        </Text>

        <View className="z-20 flex-row gap-2">
          <View className="flex-1">
            <LocationAutocomplete
              value={cityInput}
              onChange={setCityInput}
              placeholder="Stadt oder PLZ, z. B. Berlin"
            />
          </View>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setCity(cityInput.trim());
              // Collapse the expanded filter panel/calendar once a search
              // is actually triggered - otherwise these keep eating screen
              // space and the results only show far down the page.
              setShowFilters(false);
              setRangeCalendarOpen(false);
            }}
            className="items-center justify-center rounded-brand-md bg-brand-accent px-4 active:opacity-80"
          >
            <Text className="font-semibold text-white">Suchen</Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setBookingType(null)}
            className={`rounded-brand-full border px-3 py-1.5 active:opacity-70 ${
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
              className={`rounded-brand-full border px-3 py-1.5 active:opacity-70 ${
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
          <DateField
            label="Verfügbar ab"
            value={availableFromDate}
            onChange={setAvailableFromDate}
          />
        )}

        {bookingType === "KURZZEITPFLEGE" &&
          (rangeCalendarOpen ? (
            <View className="gap-2">
              <DateRangeCalendar
                startDate={rangeStart}
                endDate={rangeEnd}
                onChange={(newStart, newEnd) => {
                  setRangeStart(newStart);
                  setRangeEnd(newEnd);
                }}
              />
              <Pressable
                disabled={!rangeStart || !rangeEnd}
                onPress={() => setRangeCalendarOpen(false)}
                className={`items-center rounded-brand-md px-4 py-2.5 ${
                  rangeStart && rangeEnd
                    ? "bg-brand-accent active:opacity-80"
                    : "bg-brand-border dark:bg-brand-border-dark"
                }`}
              >
                <Text className="font-semibold text-white">Bestätigen</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setRangeCalendarOpen(true)}
              className="rounded-brand-md border border-brand-border bg-brand-background px-3 py-2.5 active:opacity-70 dark:border-brand-border-dark dark:bg-brand-background-dark"
            >
              <Text className="text-base text-brand-text dark:text-brand-text-dark">
                Von {formatShortDate(rangeStart)} – Bis {formatShortDate(rangeEnd)}
              </Text>
            </Pressable>
          ))}

        {(bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") && (
          <View className="gap-2">
            <View className="flex-row flex-wrap gap-1.5">
              {weekdayOptions.map((day) => (
                <Pressable
                  key={day.value}
                  onPress={() => toggleWeekday(day.value)}
                  className={`rounded-brand-full border px-3 py-1.5 active:opacity-70 ${
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
            <View className="flex-row gap-2">
              <TextInput
                value={hoursPerDay}
                onChangeText={(text) => {
                  const digitsOnly = text.replace(/[^0-9]/g, "");
                  if (digitsOnly === "") {
                    setHoursPerDay("");
                    return;
                  }
                  const clamped = Math.min(24, Number(digitsOnly));
                  setHoursPerDay(String(clamped));
                }}
                keyboardType="number-pad"
                placeholder="Stunden pro Tag (max. 24)"
                placeholderTextColor={colorScheme === "dark" ? "#B7C2A8" : "#6B6F62"}
                className="flex-1 rounded-brand-md border border-brand-border bg-brand-background px-3 py-2.5 text-base text-brand-text dark:border-brand-border-dark dark:bg-brand-background-dark dark:text-brand-text-dark"
              />
              <Pressable
                onPress={() => Keyboard.dismiss()}
                className="items-center justify-center rounded-brand-md border border-brand-border px-4 active:opacity-70 dark:border-brand-border-dark"
              >
                <Text className="font-semibold text-brand-accent">Fertig</Text>
              </Pressable>
            </View>
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

        <Pressable onPress={() => setShowFilters((v) => !v)} className="active:opacity-60">
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
            <View className="gap-1">
              <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                Barrierefreiheit
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {ACCESSIBILITY_AMENITIES.map((amenity) => (
                  <Pressable
                    key={amenity}
                    onPress={() => toggleAmenity(amenity)}
                    className={`active:opacity-70 rounded-brand-full border px-3 py-1.5 ${
                      amenities.includes(amenity)
                        ? "border-brand-accent bg-brand-accent"
                        : "border-brand-border dark:border-brand-border-dark"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        amenities.includes(amenity)
                          ? "text-white"
                          : "text-brand-text dark:text-brand-text-dark"
                      }`}
                    >
                      {amenity}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {!hasInteracted ? (
        <HomeContent
          facilityCount={search.data?.totalCount ?? 0}
          cityCount={cityCount}
          popularCities={popularCities}
          onSelectCity={(selected) => {
            setCityInput(selected);
            setCity(selected);
          }}
          onSelectBookingType={setBookingType}
        />
      ) : search.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2F7D4F" />
        </View>
      ) : resultsView === "map" ? (
        <View className="flex-1 bg-brand-background dark:bg-brand-background-dark">
          <View className="flex-row items-center justify-between px-6 pt-4">
            <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
              {search.data?.totalCount ?? 0} Treffer
            </Text>
            <Pressable
              onPress={() => setResultsView("list")}
              className="rounded-brand-full border border-brand-border bg-brand-background px-3 py-1.5 active:opacity-70 dark:border-brand-border-dark dark:bg-brand-background-dark"
            >
              <Text className="text-xs font-medium text-brand-text dark:text-brand-text-dark">
                📋 Liste
              </Text>
            </Pressable>
          </View>
          <FacilityResultsMap facilities={search.data?.results ?? []} />
        </View>
      ) : (
        <FlatList
          className="flex-1 bg-brand-background dark:bg-brand-background-dark"
          keyboardDismissMode="on-drag"
          data={search.data?.results ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-6"
          ListHeaderComponent={
            search.data ? (
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                  {search.data.totalCount} Treffer
                  {search.data.usedFallbackRadius ? " in der Umgebung" : ""}
                </Text>
                {googleMapsApiKey() && (
                  <Pressable
                    onPress={() => setResultsView("map")}
                    className="rounded-brand-full border border-brand-border bg-brand-background px-3 py-1.5 active:opacity-70 dark:border-brand-border-dark dark:bg-brand-background-dark"
                  >
                    <Text className="text-xs font-medium text-brand-text dark:text-brand-text-dark">
                      🗺️ Karte
                    </Text>
                  </Pressable>
                )}
              </View>
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
    </KeyboardAvoidingView>
  );
}
