import type { BookingType, SettableCareApplicationStatus } from "@woodaa/validators";
import { Stack } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Checkbox } from "@/components/Checkbox";
import { SelectField } from "@/components/SelectField";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/app/konto/pflegeleistungen +
// components/account/CareApplicationsSection.tsx. The web version's
// "Jetzt online einreichen" sub-flow (CareApplicationSubmitForm, a
// single-Krankenkasse pilot integration) isn't ported - the status
// toggle (muss beantragt werden / bereits beantragt) covers the
// non-pilot-dependent part of this screen. Versicherungsnummer/
// Krankenkasse/Pflegegrad moved to Persönliche Angaben (personal data,
// not application status) - this screen is only about the Antrag-Prozess
// selbst.
export default function PflegeleistungenScreen() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.careApplication.myCareProfile.useQuery();
  const updateProfile = trpc.careApplication.updateCareProfile.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });
  const setStatus = trpc.careApplication.setCareApplicationStatus.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });

  // Title is static, so render it unconditionally before any early return -
  // otherwise the header briefly shows the raw route path while loading.
  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <Stack.Screen options={{ title: "Pflegeleistungen beantragen" }} />
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  const pflegegradAntragLabel =
    data.pflegegrad === null || data.pflegegrad === 0
      ? "Pflegegrad-Antrag läuft bereits"
      : "Höherstufung ist bereits beantragt";

  const applicationByType = Object.fromEntries(
    data.applications.map((a) => [a.bookingType, a]),
  ) as Partial<Record<BookingType, (typeof data.applications)[number]>>;

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 p-6"
    >
      <Stack.Screen options={{ title: "Pflegeleistungen beantragen" }} />
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Pflegegrad und Krankenkasse hinterlegst du unter Persönliche Angaben - wir helfen dir dann,
        offene Anträge direkt bei eurer Krankenkasse einzureichen.
      </Text>

      <View className="gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <View className={`flex-row items-center gap-2 ${updateProfile.isPending ? "opacity-50" : ""}`}>
          <View className="flex-1">
            <Checkbox
              checked={data.pflegegradAntragLaeuft}
              onToggle={() => {
                if (updateProfile.isPending) return;
                updateProfile.mutate({ pflegegradAntragLaeuft: !data.pflegegradAntragLaeuft });
              }}
            >
              {pflegegradAntragLabel}
            </Checkbox>
          </View>
          {updateProfile.isPending && <ActivityIndicator size="small" color="#2F7D4F" />}
        </View>
      </View>

      {!data.krankenkasseConfigured && (
        <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          Die digitale Antragstellung ist aktuell im Pilotbetrieb mit einer einzelnen Krankenkasse
          und noch nicht für alle verfügbar.
        </Text>
      )}

      <View className="gap-3">
        {bookingTypeOptions.map(({ value, label }) => {
          const application = applicationByType[value];
          const status = application?.status ?? "MUSS_BEANTRAGT_WERDEN";
          const isRowPending = setStatus.isPending && setStatus.variables?.bookingType === value;

          return (
            <View
              key={value}
              className="gap-2 rounded-brand-md border border-brand-border p-4 dark:border-brand-border-dark"
            >
              <Text className="font-medium text-brand-text dark:text-brand-text-dark">{label}</Text>

              {status === "EINGEREICHT_UEBER_WOODAA" ? (
                <Text className="text-xs font-medium text-brand-accent">
                  Eingereicht am {application?.submittedAt ? formatDate(application.submittedAt) : "-"}
                </Text>
              ) : (
                <View className={`flex-row items-center gap-2 ${isRowPending ? "opacity-50" : ""}`}>
                  <View className="flex-1">
                    <SelectField
                      label="Status"
                      value={status}
                      options={[
                        { value: "MUSS_BEANTRAGT_WERDEN", label: "Muss noch beantragt werden" },
                        { value: "BEREITS_BEANTRAGT", label: "Bereits beantragt" },
                      ]}
                      onChange={(newStatus) => {
                        if (setStatus.isPending) return;
                        setStatus.mutate({
                          bookingType: value,
                          status: newStatus as SettableCareApplicationStatus,
                        });
                      }}
                    />
                  </View>
                  {isRowPending && <ActivityIndicator size="small" color="#2F7D4F" />}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
