import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { AIChatWidget } from "@/components/support/AIChatWidget";
import { FAQAccordion } from "@/components/support/FAQAccordion";
import { SupportRequestForm } from "@/components/support/SupportRequestForm";
import { useAuth } from "@/lib/AuthContext";
import { useTranslations } from "@/lib/i18n/LocaleContext";

// Mobile port of apps/web/app/hilfe/kundenservice/page.tsx +
// components/support/OperatorSupportChannels.tsx.
export default function KundenserviceScreen() {
  const { user } = useAuth();
  const t = useTranslations("hilfe");
  const tHeader = useTranslations("header");

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-3 p-6"
    >
      <Stack.Screen options={{ title: tHeader("customerService") }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        {t("kundenserviceIntro")}
      </Text>

      <SectionTitle>{t("faqSectionTitle")}</SectionTitle>
      <FAQAccordion />

      <SectionTitle>{t("phoneSectionTitle")}</SectionTitle>
      <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <Text className="text-brand-text dark:text-brand-text-dark">{t("phonePlaceholder")}</Text>
        <Text className="mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          {t("phoneCallbackHint")}
        </Text>
      </View>

      <SectionTitle>{t("aiChatSectionTitle")}</SectionTitle>
      <Text className="-mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        {t("aiChatSectionText")}
      </Text>
      <AIChatWidget />

      <SectionTitle>{t("callbackSectionTitle")}</SectionTitle>
      <Text className="-mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        {t("callbackSectionText")}
      </Text>
      <SupportRequestForm type="RUECKRUF" submitLabel={t("callbackSubmitLabel")} phoneRequired />

      <SectionTitle>{t("messageSectionTitle")}</SectionTitle>
      <Text className="-mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        {t("messageSectionText")}
      </Text>
      <SupportRequestForm type="KONTAKT" submitLabel={t("messageSubmitLabel")} />

      {user?.role === "BETREIBER" && (
        <>
          <SectionTitle>Partner-Support für Einrichtungen</SectionTitle>
          <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
            <Text className="text-brand-text dark:text-brand-text-dark">
              {/* Platzhalter - vor Live-Gang durch echte Partner-Hotline-Nummer ersetzen */}
              [Partner-Hotline] - für Fragen rund um euer Betreiber-Konto
            </Text>
            <Text className="mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
              Erreichbar Mo-Fr, 8-18 Uhr. Für dringende Fälle nutzt bitte die Nachricht unten.
            </Text>
          </View>
          <SupportRequestForm type="KONTAKT" submitLabel="Nachricht an den Partner-Support" />
        </>
      )}
    </ScrollView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mt-4 text-base font-semibold text-brand-text dark:text-brand-text-dark">
      {children}
    </Text>
  );
}
