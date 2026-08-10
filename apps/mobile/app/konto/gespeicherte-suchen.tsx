import { Stack } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { pflegegradLabels } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";
import type { Pflegegrad } from "@woodaa/validators";
import type { RouterOutputs } from "@/lib/trpc";

type SavedSearch = RouterOutputs["savedSearch"]["myList"][number];

function SavedSearchRow({ search }: { search: SavedSearch }) {
  const utils = trpc.useUtils();
  const remove = trpc.savedSearch.remove.useMutation({
    onSuccess: () => utils.savedSearch.myList.invalidate(),
  });

  const subtitle =
    [
      search.bookingType ? bookingTypeLabels[search.bookingType] : null,
      search.pflegegrad ? pflegegradLabels[search.pflegegrad as Pflegegrad] : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Alle Leistungen, jeder Pflegegrad";

  return (
    <View className="flex-row items-center justify-between gap-3 rounded-brand-md border border-brand-border p-4 dark:border-brand-border-dark">
      <View className="flex-1">
        <Text className="text-sm font-medium text-brand-text dark:text-brand-text-dark">
          {search.city}
        </Text>
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          {subtitle}
        </Text>
      </View>
      <Pressable
        disabled={remove.isPending}
        onPress={() => remove.mutate({ id: search.id })}
        className="shrink-0 rounded-brand-md border border-brand-border px-3 py-1.5 dark:border-brand-border-dark"
      >
        <Text className="text-xs font-semibold text-brand-text-muted dark:text-brand-text-muted-dark">
          Löschen
        </Text>
      </Pressable>
    </View>
  );
}

// Mobile port of apps/web/app/konto/gespeicherte-suchen +
// components/account/SavedSearchesSection.tsx. Tapping a saved search
// doesn't deep-link into a prefilled search on mobile (the search tab has
// no route-param prefill yet) - this screen is view/delete only, matching
// what the feature is actually for: email alerts on new matching slots.
export default function GespeicherteSuchenScreen() {
  const { data, isLoading } = trpc.savedSearch.myList.useQuery();

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 p-6"
    >
      <Stack.Screen options={{ title: "Gespeicherte Suchen" }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Wir informieren dich per E-Mail, sobald eine Einrichtung, die zu einer gespeicherten Suche
        passt, wieder einen freien Platz hat.
      </Text>
      {isLoading || !data ? null : data.length === 0 ? (
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Noch keine gespeicherte Suche. Speichere eine Suche über den Button „Suche speichern" auf
          der Suchergebnisseite.
        </Text>
      ) : (
        <View className="gap-3">
          {data.map((search) => (
            <SavedSearchRow key={search.id} search={search} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
