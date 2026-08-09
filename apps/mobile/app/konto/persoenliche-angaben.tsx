import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { trpc } from "@/lib/trpc";

const roleLabels = {
  SUCHENDE: "Suchende",
  BETREIBER: "Pflegeeinrichtung",
  ADMIN: "Admin",
} as const;

// Mobile port of apps/web/app/konto/persoenliche-angaben +
// components/account/AccountDetailsForm.tsx.
export default function PersoenlicheAngabenScreen() {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();
  const me = meQuery.data;

  const [nameValue, setNameValue] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const updateName = trpc.auth.updateName.useMutation();

  const [emailFormOpen, setEmailFormOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const requestEmailChange = trpc.auth.requestEmailChange.useMutation();

  if (!me) {
    return null;
  }

  const currentName = nameValue ?? me.name;

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 p-6"
    >
      <View className="gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <FormField label="Name" value={currentName} onChangeText={setNameValue} />
        <PrimaryButton
          label={updateName.isPending ? "Wird gespeichert…" : "Speichern"}
          variant="secondary"
          loading={updateName.isPending}
          disabled={currentName.trim() === me.name}
          onPress={async () => {
            setNameError(null);
            try {
              await updateName.mutateAsync({ name: currentName.trim() });
              await utils.auth.me.invalidate();
            } catch (err) {
              setNameError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
            }
          }}
        />
        {nameError && <Text className="text-sm text-red-600">{nameError}</Text>}
      </View>

      <View className="gap-2 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <View className="flex-row justify-between gap-4">
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            E-Mail
          </Text>
          <Text className="text-sm text-brand-text dark:text-brand-text-dark">{me.email}</Text>
        </View>
        <View className="flex-row justify-between gap-4">
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Rolle
          </Text>
          <Text className="text-sm text-brand-text dark:text-brand-text-dark">
            {roleLabels[me.role]}
          </Text>
        </View>

        {!emailFormOpen ? (
          <PrimaryButton
            label="E-Mail-Adresse ändern"
            variant="secondary"
            onPress={() => setEmailFormOpen(true)}
          />
        ) : requestEmailChange.isSuccess ? (
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Wir haben eine Bestätigungs-E-Mail an {me.email} geschickt. Bitte bestätige dort die
            Änderung - danach schicken wir eine zweite Bestätigung an die neue Adresse.
          </Text>
        ) : (
          <View className="gap-2">
            <FormField
              label="Neue E-Mail-Adresse"
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <PrimaryButton
              label={requestEmailChange.isPending ? "Wird gesendet…" : "Anfordern"}
              variant="secondary"
              loading={requestEmailChange.isPending}
              onPress={async () => {
                setEmailError(null);
                try {
                  await requestEmailChange.mutateAsync({ newEmail: newEmail.trim() });
                } catch (err) {
                  setEmailError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
                }
              }}
            />
          </View>
        )}
        {emailError && <Text className="text-sm text-red-600">{emailError}</Text>}
      </View>
    </ScrollView>
  );
}
