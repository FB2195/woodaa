import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { DateField } from "@/components/DateField";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SelectField } from "@/components/SelectField";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import { trpc } from "@/lib/trpc";

const roleLabels = {
  SUCHENDE: "Suchende",
  BETREIBER: "Pflegeeinrichtung",
  ADMIN: "Admin",
} as const;

function toISODate(date: Date | null): string | undefined {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  return new Date(value);
}

// Mobile port of apps/web/app/konto/persoenliche-angaben +
// components/account/AccountDetailsForm.tsx - erweitert um Adresse,
// Geburtsdatum, Pflegegrad, Krankenkasse und Versicherungsnummer, die
// bisher nirgends (weder App noch Web) nach der Registrierung bearbeitbar
// waren (siehe careApplication.updateCareProfile).
export default function PersoenlicheAngabenScreen() {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();
  const me = meQuery.data;
  const profileQuery = trpc.careApplication.myCareProfile.useQuery();
  const profile = profileQuery.data;
  const updateProfile = trpc.careApplication.updateCareProfile.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });

  const [nameValue, setNameValue] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const updateName = trpc.auth.updateName.useMutation();

  const [emailFormOpen, setEmailFormOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const requestEmailChange = trpc.auth.requestEmailChange.useMutation();

  const [vorname, setVorname] = useState<string | null>(null);
  const [nachname, setNachname] = useState<string | null>(null);
  const [geburtsdatum, setGeburtsdatum] = useState<Date | null | undefined>(undefined);
  const [street, setStreet] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [pflegegrad, setPflegegrad] = useState<number | null | undefined>(undefined);
  const [krankenkasse, setKrankenkasse] = useState<string | null>(null);
  const [versicherungsnummer, setVersicherungsnummer] = useState<string | null>(null);
  const [versicherungsnummerVisible, setVersicherungsnummerVisible] = useState(false);
  const [careError, setCareError] = useState<string | null>(null);

  // Title is static, so render it even in the loading/no-data case - the
  // previous bare `return null` left no Stack.Screen mounted, so the header
  // briefly fell back to showing the raw route path. Also show a spinner
  // instead of a blank screen while the queries are still loading.
  if (!me || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <Stack.Screen options={{ title: "Persönliche Angaben" }} />
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  const currentName = nameValue ?? me.name;

  const vornameValue = vorname ?? profile.vorname;
  const nachnameValue = nachname ?? profile.nachname;
  const geburtsdatumValue = geburtsdatum === undefined ? parseISODate(profile.geburtsdatum) : geburtsdatum;
  const streetValue = street ?? profile.street;
  const postalCodeValue = postalCode ?? profile.postalCode;
  const cityValue = city ?? profile.city;
  const phoneValue = phone ?? profile.phone;

  const pflegegradValue = pflegegrad === undefined ? profile.pflegegrad : pflegegrad;
  const krankenkasseValue = krankenkasse ?? profile.krankenkasse ?? "";
  const versicherungsnummerValue = versicherungsnummer ?? profile.versicherungsnummer ?? "";

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 p-6"
    >
      <Stack.Screen options={{ title: "Persönliche Angaben" }} />

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
        {me.role !== "SUCHENDE" && (
          <View className="flex-row justify-between gap-4">
            <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
              Rolle
            </Text>
            <Text className="text-sm text-brand-text dark:text-brand-text-dark">
              {roleLabels[me.role]}
            </Text>
          </View>
        )}

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

      {me.role === "SUCHENDE" && (
        <>
          <View className="gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
            <Text className="text-sm font-semibold text-brand-text dark:text-brand-text-dark">
              Adresse & Kontakt
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormField label="Vorname" value={vornameValue} onChangeText={setVorname} />
              </View>
              <View className="flex-1">
                <FormField label="Nachname" value={nachnameValue} onChangeText={setNachname} />
              </View>
            </View>
            <DateField label="Geburtsdatum" value={geburtsdatumValue} onChange={setGeburtsdatum} />
            <FormField label="Straße & Hausnummer" value={streetValue} onChangeText={setStreet} />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormField
                  label="PLZ"
                  value={postalCodeValue}
                  onChangeText={setPostalCode}
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <FormField label="Stadt" value={cityValue} onChangeText={setCity} />
              </View>
            </View>
            <FormField
              label="Telefon"
              value={phoneValue}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {addressError && <Text className="text-sm text-red-600">{addressError}</Text>}

            <PrimaryButton
              label={updateProfile.isPending ? "Wird gespeichert…" : "Speichern"}
              variant="secondary"
              loading={updateProfile.isPending}
              onPress={async () => {
                setAddressError(null);
                try {
                  await updateProfile.mutateAsync({
                    vorname: vornameValue.trim() || undefined,
                    nachname: nachnameValue.trim() || undefined,
                    geburtsdatum: toISODate(geburtsdatumValue),
                    street: streetValue.trim() || undefined,
                    postalCode: postalCodeValue.trim() || undefined,
                    city: cityValue.trim() || undefined,
                    phone: phoneValue.trim() || undefined,
                  });
                } catch (err) {
                  setAddressError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
                }
              }}
            />
          </View>

          <View className="gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
            <Text className="text-sm font-semibold text-brand-text dark:text-brand-text-dark">
              Pflegeangaben
            </Text>
            <SelectField
              label="Aktueller Pflegegrad"
              value={pflegegradValue}
              options={pflegegradOptions}
              placeholder="Nicht angegeben"
              onChange={setPflegegrad}
            />
            <FormField
              label="Krankenkasse"
              value={krankenkasseValue}
              onChangeText={setKrankenkasse}
              placeholder="z. B. AOK, TK, Barmer…"
            />
            <FormField
              label="Versicherungsnummer"
              labelRight={
                <Pressable onPress={() => setVersicherungsnummerVisible((v) => !v)} hitSlop={8}>
                  <Text className="text-xs font-semibold text-brand-accent">
                    {versicherungsnummerVisible ? "Verbergen" : "Anzeigen"}
                  </Text>
                </Pressable>
              }
              value={versicherungsnummerValue}
              onChangeText={setVersicherungsnummer}
              secureTextEntry={!versicherungsnummerVisible}
              autoCapitalize="characters"
              placeholder="z. B. A123456789"
            />

            {careError && <Text className="text-sm text-red-600">{careError}</Text>}

            <PrimaryButton
              label={updateProfile.isPending ? "Wird gespeichert…" : "Speichern"}
              variant="secondary"
              loading={updateProfile.isPending}
              onPress={async () => {
                setCareError(null);
                try {
                  await updateProfile.mutateAsync({
                    ...(pflegegradValue !== null && pflegegradValue !== undefined
                      ? { pflegegrad: pflegegradValue as 0 | 1 | 2 | 3 | 4 | 5 }
                      : {}),
                    ...(krankenkasseValue.trim() ? { krankenkasse: krankenkasseValue.trim() } : {}),
                    ...(versicherungsnummerValue.trim()
                      ? { versicherungsnummer: versicherungsnummerValue.trim() }
                      : {}),
                  });
                } catch (err) {
                  setCareError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
                }
              }}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}
