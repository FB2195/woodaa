import * as Location from "expo-location";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/components/search/LocationAutocomplete.tsx: same
// debounced trpc.facility.searchLocations query and "use my location" ->
// trpc.facility.reverseGeocode flow, adapted from a DOM dropdown + document
// click-outside listener to a RN FlatList + onBlur (RN has no
// click-outside event, so suggestion taps race the TextInput's blur -
// delayed via setTimeout, same trick used broadly for this in RN).
export function LocationAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { colorScheme } = useColorScheme();
  const [debounced, setDebounced] = useState(value);
  const [open, setOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "error">("idle");
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(id);
  }, [value]);

  const suggestions = trpc.facility.searchLocations.useQuery(
    { query: debounced },
    { enabled: debounced.trim().length >= 2 },
  );

  async function useMyLocation() {
    setGeoStatus("loading");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGeoStatus("error");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { city } = await utils.client.facility.reverseGeocode.query({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (!city) {
        setGeoStatus("error");
        return;
      }
      onChange(city);
      setOpen(false);
      setGeoStatus("idle");
    } catch {
      setGeoStatus("error");
    }
  }

  const showSuggestions =
    open && debounced.trim().length >= 2 && (suggestions.data?.length ?? 0) > 0;
  const showLocateOption = open && value.trim().length === 0;
  const showDropdown = showSuggestions || showLocateOption;

  return (
    <View className="relative z-10">
      <TextInput
        value={value}
        onChangeText={(text) => {
          onChange(text);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        placeholderTextColor={colorScheme === "dark" ? "#B7C2A8" : "#6B6F62"}
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-brand-md border border-brand-border bg-brand-background px-3 py-2.5 text-base text-brand-text dark:border-brand-border-dark dark:bg-brand-background-dark dark:text-brand-text-dark"
      />
      {showDropdown && (
        <View
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 rounded-brand-md border border-brand-border bg-brand-surface shadow-lg dark:border-brand-border-dark dark:bg-brand-surface-dark"
          onStartShouldSetResponder={() => true}
        >
          {showLocateOption && (
            <View>
              <Pressable
                disabled={geoStatus === "loading"}
                onPress={() => {
                  if (blurTimeout.current) clearTimeout(blurTimeout.current);
                  void useMyLocation();
                }}
                className="flex-row items-center gap-2 px-4 py-3"
              >
                {geoStatus === "loading" ? (
                  <ActivityIndicator size="small" color="#2F7D4F" />
                ) : (
                  <Text className="text-brand-accent">📍</Text>
                )}
                <Text className="text-sm font-medium text-brand-accent">
                  {geoStatus === "loading" ? "Standort wird ermittelt…" : "In deiner Nähe suchen"}
                </Text>
              </Pressable>
              {geoStatus === "error" && (
                <Text className="px-4 pb-2 text-xs text-red-600">
                  Standort konnte nicht ermittelt werden. Bitte Stadt eingeben.
                </Text>
              )}
            </View>
          )}
          {showSuggestions && (
            <FlatList
              keyboardShouldPersistTaps="always"
              data={suggestions.data ?? []}
              keyExtractor={(item) => item.placeId ?? `${item.city}-${item.postalCode}`}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    if (blurTimeout.current) clearTimeout(blurTimeout.current);
                    onChange(item.city);
                    setOpen(false);
                  }}
                  className="border-t border-brand-border px-4 py-2.5 first:border-t-0 dark:border-brand-border-dark"
                >
                  <Text className="text-sm text-brand-text dark:text-brand-text-dark">
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}
