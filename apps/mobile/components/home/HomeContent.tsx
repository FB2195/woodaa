import type { BookingType } from "@woodaa/validators";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { resolvePhotoUrl } from "@/lib/photoUrl";

// Mobile port of apps/web/app/page.tsx's landing content (Hero + WhySection
// + booking-type grid), shown in place of the search results list until the
// user actually searches (see (tabs)/index.tsx's `hasInteracted`) - the web
// app has a separate "/" route for this, but the mobile tab bar only has
// room for Suche/Buchungen/Konto (see task requirements), so the Suche tab
// itself starts on this landing state instead of an empty results list.
// OperatorCtaSection isn't ported: it's a B2B conversion widget aimed at
// facility operators, not something a Suchende searching for care needs.

const bookingTypeIcons: Record<BookingType, string> = {
  STATIONAERE_AUFNAHME: "🏡",
  KURZZEITPFLEGE: "🩺",
  TAGESPFLEGE: "☀️",
  NACHTPFLEGE: "🌙",
};

const trustPoints = [
  {
    icon: "⚡",
    title: "Echtzeit-Verfügbarkeit",
    text: "Kein Rätselraten am Telefon - Sie sehen sofort, wo aktuell wirklich ein Platz frei ist.",
  },
  {
    icon: "🔒",
    title: "Keine Doppelbuchung",
    text: "Jeder gebuchte Platz wird technisch abgesichert reserviert - garantiert kein Verwechseln, keine Doppelvergabe.",
  },
  {
    icon: "✅",
    title: "Geprüfte Einrichtungen",
    text: "Jede Einrichtung wird vor der Veröffentlichung von uns geprüft, bevor sie sichtbar wird.",
  },
  {
    icon: "🤝",
    title: "Kostenlos & unverbindlich anfragen",
    text: "Erst in Ruhe informieren, dann entscheiden - eine Anfrage kostet nichts und verpflichtet zu nichts.",
  },
];

type PopularCity = { city: string; count: number; photoUrl: string | null };

export function HomeContent({
  facilityCount,
  cityCount,
  popularCities,
  onSelectCity,
  onSelectBookingType,
}: {
  facilityCount: number;
  cityCount: number;
  popularCities: PopularCity[];
  onSelectCity: (city: string) => void;
  onSelectBookingType: (type: BookingType) => void;
}) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-8 p-6"
      keyboardDismissMode="on-drag"
    >
      <View>
        <Text className="text-2xl font-bold text-brand-primary-dark dark:text-brand-heading-dark">
          Pflegeplatz online buchen
        </Text>
        <Text className="mt-1 text-base font-medium text-brand-accent">Jetzt bei woodaa</Text>
        <Text className="mt-3 text-sm leading-5 text-brand-text-muted dark:text-brand-text-muted-dark">
          So einfach wie eine Hotelbuchung. Mit woodaa finden Sie die passende Einrichtung und
          können sofort online buchen.
        </Text>
        {facilityCount > 0 && (
          <Text className="mt-3 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
            {facilityCount} Einrichtungen in {cityCount} Städten
          </Text>
        )}
      </View>

      {popularCities.length > 0 && (
        <View>
          <Text className="text-lg font-semibold text-brand-text dark:text-brand-text-dark">
            Beliebte Städte
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-3">
            {popularCities.map((entry) => (
              <Pressable
                key={entry.city}
                onPress={() => onSelectCity(entry.city)}
                className="w-[47%] overflow-hidden rounded-brand-lg border border-brand-border dark:border-brand-border-dark"
              >
                {entry.photoUrl ? (
                  <Image source={{ uri: entry.photoUrl }} className="h-24 w-full" resizeMode="cover" />
                ) : (
                  <View className="h-24 w-full items-center justify-center bg-brand-surface dark:bg-brand-surface-dark">
                    <Text className="text-2xl">🏙️</Text>
                  </View>
                )}
                <View className="bg-brand-surface px-2.5 py-2 dark:bg-brand-surface-dark">
                  <Text className="text-sm font-semibold text-brand-text dark:text-brand-text-dark">
                    {entry.city}
                  </Text>
                  <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                    {entry.count} {entry.count === 1 ? "Einrichtung" : "Einrichtungen"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View>
        <Text className="text-lg font-semibold text-brand-text dark:text-brand-text-dark">
          Welche Art von Pflege wird gesucht?
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-3">
          {(Object.keys(bookingTypeLabels) as BookingType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => onSelectBookingType(type)}
              className="w-[47%] rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark"
            >
              <Text className="text-2xl">{bookingTypeIcons[type]}</Text>
              <Text className="mt-2 text-sm font-semibold text-brand-heading dark:text-brand-heading-dark">
                {bookingTypeLabels[type]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text className="text-lg font-semibold text-brand-text dark:text-brand-text-dark">
          Warum woodaa?
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 -mx-6 px-6">
          <View className="flex-row gap-3">
            {trustPoints.map((point) => (
              <View
                key={point.title}
                className="w-60 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark"
              >
                <Text className="text-2xl">{point.icon}</Text>
                <Text className="mt-2 text-sm font-semibold text-brand-heading dark:text-brand-heading-dark">
                  {point.title}
                </Text>
                <Text className="mt-1 text-xs leading-4 text-brand-text-muted dark:text-brand-text-muted-dark">
                  {point.text}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

export function buildPopularCities(
  facilities: { city: string; photos: { url: string | null }[] }[],
): PopularCity[] {
  const cityInfo = new Map<string, PopularCity>();
  for (const facility of facilities) {
    const existing = cityInfo.get(facility.city);
    if (existing) {
      existing.count += 1;
    } else {
      cityInfo.set(facility.city, {
        city: facility.city,
        count: 1,
        photoUrl: resolvePhotoUrl(facility.photos[0]?.url),
      });
    }
  }
  return [...cityInfo.values()].sort((a, b) => b.count - a.count).slice(0, 6);
}
