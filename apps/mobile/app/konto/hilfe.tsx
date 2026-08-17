import { router, Stack } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslations } from "@/lib/i18n/LocaleContext";

// Mobile port of apps/web/app/hilfe/page.tsx.
export default function HilfeScreen() {
  const t = useTranslations("hilfe");
  const tHeader = useTranslations("header");

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 p-6"
    >
      <Stack.Screen options={{ title: tHeader("helpSupport") }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        {t("introText")}
      </Text>

      <Pressable
        onPress={() => router.push("/konto/kundenservice")}
        className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark"
      >
        <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          {tHeader("customerService")}
        </Text>
        <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          {t("customerServiceCardText")}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/konto/fehler-melden")}
        className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark"
      >
        <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          {tHeader("reportIssue")}
        </Text>
        <View>
          <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            {t("reportIssueCardText")}
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}
