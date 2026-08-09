import type { BookingType, SettableCareApplicationStatus } from "@woodaa/validators";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Checkbox } from "@/components/Checkbox";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SelectField } from "@/components/SelectField";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { formatDate } from "@/lib/format";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/app/konto/pflegeleistungen +
// components/account/CareApplicationsSection.tsx. The web version's
// "Jetzt online einreichen" sub-flow (CareApplicationSubmitForm, a
// single-Krankenkasse pilot integration) isn't ported - the status
// toggle (muss beantragt werden / bereits beantragt) covers the
// non-pilot-dependent part of this screen.
export default function PflegeleistungenScreen() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.careApplication.myCareProfile.useQuery();
  const [versicherungsnummer, setVersicherungsnummer] = useState<string | null>(null);
  const [krankenkasse, setKrankenkasse] = useState<string | null>(null);
  const [pflegegrad, setPflegegrad] = useState<number | null | undefined>(undefined);
  const [profileError, setProfileError] = useState<string | null>(null);

  const updateProfile = trpc.careApplication.updateCareProfile.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });
  const setStatus = trpc.careApplication.setCareApplicationStatus.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  const versicherungsnummerValue = versicherungsnummer ?? data.versicherungsnummer ?? "";
  const krankenkasseValue = krankenkasse ?? data.krankenkasse ?? "";
  const pflegegradValue = pflegegrad === undefined ? data.pflegegrad : pflegegrad;

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
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Hinterlege deine Versicherungsnummer und deinen Pflegegrad - wir helfen dir dann, offene
        Anträge direkt bei eurer Krankenkasse einzureichen.
      </Text>

      <View className="gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <FormField
          label="Versicherungsnummer"
          value={versicherungsnummerValue}
          onChangeText={setVersicherungsnummer}
          autoCapitalize="characters"
          placeholder="z. B. A123456789"
        />
        <FormField
          label="Krankenkasse"
          value={krankenkasseValue}
          onChangeText={setKrankenkasse}
          placeholder="z. B. AOK, TK, Barmer…"
        />
        <SelectField
          label="Aktueller Pflegegrad"
          value={pflegegradValue}
          options={pflegegradOptions}
          placeholder="Nicht angegeben"
          onChange={setPflegegrad}
        />
        <Checkbox
          checked={data.pflegegradAntragLaeuft}
          onToggle={() => updateProfile.mutate({ pflegegradAntragLaeuft: !data.pflegegradAntragLaeuft })}
        >
          {pflegegradAntragLabel}
        </Checkbox>

        {profileError && <Text className="text-sm text-red-600">{profileError}</Text>}

        <PrimaryButton
          label={updateProfile.isPending ? "Wird gespeichert…" : "Speichern"}
          variant="secondary"
          loading={updateProfile.isPending}
          onPress={async () => {
            setProfileError(null);
            try {
              await updateProfile.mutateAsync({
                ...(versicherungsnummerValue.trim()
                  ? { versicherungsnummer: versicherungsnummerValue.trim() }
                  : {}),
                ...(pflegegradValue !== null && pflegegradValue !== undefined
                  ? { pflegegrad: pflegegradValue as 0 | 1 | 2 | 3 | 4 | 5 }
                  : {}),
                ...(krankenkasseValue.trim() ? { krankenkasse: krankenkasseValue.trim() } : {}),
              });
            } catch (err) {
              setProfileError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
            }
          }}
        />
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
                <SelectField
                  label="Status"
                  value={status}
                  options={[
                    { value: "MUSS_BEANTRAGT_WERDEN", label: "Muss noch beantragt werden" },
                    { value: "BEREITS_BEANTRAGT", label: "Bereits beantragt" },
                  ]}
                  onChange={(newStatus) =>
                    setStatus.mutate({
                      bookingType: value,
                      status: newStatus as SettableCareApplicationStatus,
                    })
                  }
                />
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
