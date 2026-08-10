import { Image, Linking, Pressable, Text, View } from "react-native";
import { googleMapsApiKey } from "@/lib/googleMapsConfig";

// Same static-map approach as FacilityLocationMap.tsx (no new native map
// dependency). A static image can't do per-marker taps, so tapping it
// opens the full facility list centered in the OS Maps app instead - less
// interactive than web's clickable pins, but a much lower-risk way to
// give mobile a map view at all.
export function FacilityResultsMap({
  facilities,
}: {
  facilities: { id: string; name: string; latitude: number | null; longitude: number | null }[];
}) {
  const apiKey = googleMapsApiKey();
  const located = facilities.filter(
    (f): f is typeof f & { latitude: number; longitude: number } =>
      f.latitude !== null && f.longitude !== null,
  );

  if (!apiKey || located.length === 0) return null;

  const markers = located
    .map((f) => `markers=color:0x2F7D4F%7C${f.latitude},${f.longitude}`)
    .join("&");
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&scale=2&${markers}&key=${apiKey}`;

  function openInMapsApp() {
    const first = located[0]!;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${first.latitude},${first.longitude}`);
  }

  return (
    <View className="p-6">
      <Pressable onPress={openInMapsApp}>
        <Image
          source={{ uri: staticMapUrl }}
          className="h-64 w-full rounded-brand-lg"
          resizeMode="cover"
        />
      </Pressable>
      <Text className="mt-2 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
        Zum Vergrößern und Erkunden antippen – öffnet Maps.
      </Text>
    </View>
  );
}
