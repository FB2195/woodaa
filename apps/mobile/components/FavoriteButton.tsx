import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import { useAuth } from "@/lib/AuthContext";
import { trpc } from "@/lib/trpc";

// RN port of apps/web/components/FavoriteButton.tsx. Simpler than the web
// version: no SSR to pre-hydrate an initial value from, so this just reads
// straight from favorite.myFacilityIds (react-query dedups the request
// across every card on screen) instead of threading an initialFavorited
// prop through FacilityCard everywhere it's rendered.
export function FavoriteButton({ facilityId }: { facilityId: string }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const favoriteIds = trpc.favorite.myFacilityIds.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const toggle = trpc.favorite.toggle.useMutation({
    onSuccess: () => {
      utils.favorite.myFacilityIds.invalidate();
      utils.favorite.list.invalidate();
    },
  });

  const favorited = favoriteIds.data?.includes(facilityId) ?? false;

  return (
    <Pressable
      onPress={() => {
        if (!user) {
          router.push("/login");
          return;
        }
        toggle.mutate({ facilityId });
      }}
      disabled={toggle.isPending}
      hitSlop={8}
      className={`h-9 w-9 items-center justify-center rounded-brand-full bg-brand-surface/90 active:opacity-60 dark:bg-brand-surface-dark/90 ${toggle.isPending ? "opacity-50" : ""}`}
    >
      <Text className={favorited ? "text-lg text-red-500" : "text-lg text-brand-text-muted"}>
        {favorited ? "♥" : "♡"}
      </Text>
    </Pressable>
  );
}
