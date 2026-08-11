import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, Share, Text, View } from "react-native";
import { apiBaseUrl } from "@/lib/apiConfig";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        {label}
      </Text>
      <Text className="flex-1 text-right text-sm text-brand-text dark:text-brand-text-dark">
        {value}
      </Text>
    </View>
  );
}

function PolicyRow({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="border-b border-brand-border py-4 dark:border-brand-border-dark">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between"
      >
        <Text className="text-base font-semibold text-brand-text dark:text-brand-text-dark">
          {title}
        </Text>
        <Text className="text-brand-text-muted dark:text-brand-text-muted-dark">
          {open ? "▲" : "▼"}
        </Text>
      </Pressable>
      {open && <View className="mt-3 gap-2">{children}</View>}
    </View>
  );
}

// RN port of apps/web/components/FacilityPolicyLinks.tsx + ShareFacilityButton.tsx.
export function FacilityPolicyLinks({
  slug,
  name,
  checkInTime,
  checkOutTime,
  visitingHours,
  wifiInfo,
  parkingInfo,
  petsPolicy,
  cancellationPolicyDays,
}: {
  slug: string;
  name: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  visitingHours: string | null;
  wifiInfo: string | null;
  parkingInfo: string | null;
  petsPolicy: string | null;
  cancellationPolicyDays: number | null;
}) {
  const hasHouseRules = checkInTime || checkOutTime || visitingHours || cancellationPolicyDays !== null;
  const hasDetails = wifiInfo || parkingInfo || petsPolicy;

  return (
    <View className="rounded-brand-lg border border-brand-border dark:border-brand-border-dark">
      <View className="px-3">
        {hasHouseRules && (
          <PolicyRow title="Unterkunftsrichtlinien">
            {checkInTime && <InfoRow label="Check-in" value={checkInTime} />}
            {checkOutTime && <InfoRow label="Check-out" value={checkOutTime} />}
            {visitingHours && <InfoRow label="Besuchszeiten" value={visitingHours} />}
            {cancellationPolicyDays !== null && (
              <InfoRow
                label="Stornierung"
                value={`Bis ${cancellationPolicyDays} ${cancellationPolicyDays === 1 ? "Tag" : "Tage"} vorher kostenlos`}
              />
            )}
          </PolicyRow>
        )}

        {hasDetails && (
          <PolicyRow title="Wichtige Einzelheiten">
            {wifiInfo && <InfoRow label="Internetzugang" value={wifiInfo} />}
            {parkingInfo && <InfoRow label="Parkmöglichkeiten" value={parkingInfo} />}
            {petsPolicy && <InfoRow label="Haustiere" value={petsPolicy} />}
          </PolicyRow>
        )}

        <PolicyRow title="Rechtliche Informationen">
          <Pressable onPress={() => router.push("/konto/impressum")}>
            <Text className="text-sm text-brand-accent underline">Impressum</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/konto/datenschutz")}>
            <Text className="text-sm text-brand-accent underline">Datenschutz</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/konto/nutzungsbedingungen")}>
            <Text className="text-sm text-brand-accent underline">Nutzungsbedingungen</Text>
          </Pressable>
        </PolicyRow>
      </View>

      <View className="border-t border-brand-border p-4 dark:border-brand-border-dark">
        <Pressable
          onPress={() => {
            void Share.share({
              message: `${name} – ${apiBaseUrl()}/einrichtung/${slug}`,
              url: `${apiBaseUrl()}/einrichtung/${slug}`,
            });
          }}
          className="flex-row items-center justify-between rounded-brand-md border border-brand-border px-4 py-3 dark:border-brand-border-dark"
        >
          <Text className="text-sm font-semibold text-brand-text dark:text-brand-text-dark">
            Link der Einrichtung teilen
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
