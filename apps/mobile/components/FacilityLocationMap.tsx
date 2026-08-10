import { Image, Linking, Platform, Pressable } from "react-native";
import { googleMapsApiKey } from "@/lib/googleMapsConfig";

// Deliberately a static map image (Google Maps Static API) instead of
// react-native-maps: no new native module/config needed on either
// platform (see apps/mobile/assets/README.md-adjacent history of native-
// module crashes this app has had), tapping it opens the OS's own Maps
// app for full interaction. Mirrors apps/web/components/FacilityLocationMap.tsx's
// purpose with a platform-appropriate, lower-risk implementation.
export function FacilityLocationMap({
  latitude,
  longitude,
  facilityName,
}: {
  latitude: number | null;
  longitude: number | null;
  facilityName: string;
}) {
  const apiKey = googleMapsApiKey();
  if (latitude === null || longitude === null || !apiKey) return null;

  const staticMapUrl =
    `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}` +
    `&zoom=14&size=600x300&scale=2&markers=color:0x2F7D4F%7C${latitude},${longitude}&key=${apiKey}`;

  function openInMapsApp() {
    const label = encodeURIComponent(facilityName);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url);
  }

  return (
    <Pressable onPress={openInMapsApp}>
      <Image
        source={{ uri: staticMapUrl }}
        className="h-40 w-full rounded-brand-lg"
        resizeMode="cover"
      />
    </Pressable>
  );
}
