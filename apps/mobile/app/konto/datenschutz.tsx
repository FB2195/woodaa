import { router, Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useTranslations } from "@/lib/i18n/LocaleContext";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-1">
      <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        {title}
      </Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text className="text-sm text-brand-text dark:text-brand-text-dark">{children}</Text>;
}

// Mobile port of apps/web/app/datenschutz/page.tsx - same translated text
// (see lib/i18n), same six languages.
export default function DatenschutzScreen() {
  const t = useTranslations("datenschutz");

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-6 p-6"
    >
      <Stack.Screen options={{ title: t("title") }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        {t("intro")}
      </Text>

      <Section title={t("controllerTitle")}>
        <Text className="text-sm text-brand-text dark:text-brand-text-dark">
          {t("controllerBody")}{" "}
          <Text
            onPress={() => router.push("/konto/impressum")}
            className="text-brand-accent underline"
          >
            Impressum
          </Text>
          .
        </Text>
      </Section>

      <Section title={t("dataTitle")}>
        <P>• {t("dataAccount")}</P>
        <P>• {t("dataCare")}</P>
        <P>• {t("dataBooking")}</P>
        <P>• {t("dataPayment")}</P>
        <P>• {t("dataReviews")}</P>
        <P>• {t("dataLocation")}</P>
        <P>• {t("dataCookies")}</P>
      </Section>

      <Section title={t("purposeTitle")}>
        <P>{t("purposeBody")}</P>
      </Section>

      <Section title={t("providersTitle")}>
        <P>• {t("providerStripe")}</P>
        <P>• {t("providerResend")}</P>
        <P>• {t("providerR2")}</P>
        <P>• {t("providerMaps")}</P>
        <P>• {t("providerHosting")}</P>
      </Section>

      <Section title={t("rightsTitle")}>
        <Text className="text-sm text-brand-text dark:text-brand-text-dark">
          {t("rightsBodyPre")}{" "}
          <Text
            onPress={() => router.push("/konto/kundenservice")}
            className="text-brand-accent underline"
          >
            {t("rightsBodyLinkText")}
          </Text>{" "}
          {t("rightsBodyPost")}
        </Text>
      </Section>

      <Section title={t("retentionTitle")}>
        <P>{t("retentionBody")}</P>
      </Section>
    </ScrollView>
  );
}
