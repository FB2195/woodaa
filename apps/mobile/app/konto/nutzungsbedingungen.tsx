import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useTranslations } from "@/lib/i18n/LocaleContext";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-1">
      <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        {title}
      </Text>
      <Text className="text-sm text-brand-text dark:text-brand-text-dark">{children}</Text>
    </View>
  );
}

// Mobile port of apps/web/app/nutzungsbedingungen/page.tsx - same
// translated text (see lib/i18n), same six languages.
export default function NutzungsbedingungenScreen() {
  const t = useTranslations("nutzungsbedingungen");

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-6 p-6"
    >
      <Stack.Screen options={{ title: t("title") }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        {t("intro")}
      </Text>

      <Section title={t("descriptionTitle")}>{t("descriptionBody")}</Section>
      <Section title={t("registrationTitle")}>{t("registrationBody")}</Section>
      <Section title={t("bookingsTitle")}>{t("bookingsBody")}</Section>
      <Section title={t("facilityDutiesTitle")}>{t("facilityDutiesBody")}</Section>
      <Section title={t("liabilityTitle")}>{t("liabilityBody")}</Section>
      <Section title={t("changesTitle")}>{t("changesBody")}</Section>
    </ScrollView>
  );
}
