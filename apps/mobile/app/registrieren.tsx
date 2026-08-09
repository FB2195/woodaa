import { GESETZLICHE_VERSICHERUNGSNUMMER_REGEX, type Pflegegrad } from "@woodaa/validators";
import { Link, router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Checkbox } from "@/components/Checkbox";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SelectField } from "@/components/SelectField";
import { useAuth } from "@/lib/AuthContext";
import { GESETZLICHE_KRANKENKASSEN } from "@/lib/krankenkassen";
import { pflegegradOptions } from "@/lib/pflegegradLabels";

const ANDERE_KASSE = "Andere gesetzliche Krankenkasse";
type KrankenkasseArt = "GESETZLICH" | "PRIVAT";

const krankenkasseArtOptions: { value: KrankenkasseArt; label: string }[] = [
  { value: "GESETZLICH", label: "Gesetzliche Krankenkasse" },
  { value: "PRIVAT", label: "Private Krankenversicherung" },
];

function onSuccess() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)/konto");
  }
}

export default function RegisterScreen() {
  const { register } = useAuth();

  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [geburtstag, setGeburtstag] = useState("");
  const [geburtsmonat, setGeburtsmonat] = useState("");
  const [geburtsjahr, setGeburtsjahr] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [pflegegrad, setPflegegrad] = useState<Pflegegrad | null>(null);
  const [pflegegradAntragLaeuft, setPflegegradAntragLaeuft] = useState(false);
  const [krankenkasseArt, setKrankenkasseArt] = useState<KrankenkasseArt | null>(null);
  const [gesetzlicheKasse, setGesetzlicheKasse] = useState<string | null>(null);
  const [krankenkasseAndere, setKrankenkasseAndere] = useState("");
  const [krankenkassePrivatName, setKrankenkassePrivatName] = useState("");
  const [versicherungsnummer, setVersicherungsnummer] = useState("");

  const [hatBevollmaechtigten, setHatBevollmaechtigten] = useState(false);
  const [bevollmaechtigterVorname, setBevollmaechtigterVorname] = useState("");
  const [bevollmaechtigterNachname, setBevollmaechtigterNachname] = useState("");
  const [bevollmaechtigterAdresse, setBevollmaechtigterAdresse] = useState("");
  const [bevollmaechtigterTelefon, setBevollmaechtigterTelefon] = useState("");
  const [bevollmaechtigterEmail, setBevollmaechtigterEmail] = useState("");

  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [datenschutzAccepted, setDatenschutzAccepted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pflegegradAntragLabel =
    pflegegrad === null || pflegegrad === 0
      ? "Pflegegrad bereits beantragt"
      : "Erhöhung des Pflegegrades beantragt";

  const krankenkasseOptions = [
    ...GESETZLICHE_KRANKENKASSEN.map((kasse) => ({ value: kasse, label: kasse })),
  ];

  async function onSubmit() {
    setError(null);

    if (pflegegrad === null) {
      setError("Bitte wähle einen Pflegegrad aus.");
      return;
    }
    if (krankenkasseArt === null) {
      setError("Bitte wähle gesetzlich oder privat versichert aus.");
      return;
    }
    if (
      krankenkasseArt === "GESETZLICH" &&
      (!gesetzlicheKasse || (gesetzlicheKasse === ANDERE_KASSE && !krankenkasseAndere.trim()))
    ) {
      setError("Bitte wähle deine Krankenkasse aus.");
      return;
    }
    if (krankenkasseArt === "PRIVAT" && !krankenkassePrivatName.trim()) {
      setError("Bitte gib den Namen deiner privaten Krankenversicherung an.");
      return;
    }
    if (
      krankenkasseArt === "GESETZLICH" &&
      !GESETZLICHE_VERSICHERUNGSNUMMER_REGEX.test(versicherungsnummer)
    ) {
      setError(
        "Das sieht nicht nach einer gültigen Versichertennummer aus - sie besteht aus einem " +
          "Buchstaben gefolgt von 9 Ziffern (z. B. A123456789) und steht auf der Vorderseite " +
          "deiner Versichertenkarte.",
      );
      return;
    }
    if (!agbAccepted || !datenschutzAccepted) {
      setError("Bitte akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung.");
      return;
    }

    const krankenkasse =
      krankenkasseArt === "PRIVAT"
        ? krankenkassePrivatName.trim()
        : gesetzlicheKasse === ANDERE_KASSE
          ? krankenkasseAndere.trim()
          : (gesetzlicheKasse ?? "");

    const geburtsdatum = `${geburtsjahr.padStart(4, "0")}-${geburtsmonat.padStart(2, "0")}-${geburtstag.padStart(2, "0")}`;

    setSubmitting(true);
    try {
      await register({
        role: "SUCHENDE",
        vorname: vorname.trim(),
        nachname: nachname.trim(),
        email: email.trim(),
        password,
        geburtsdatum,
        street: street.trim(),
        postalCode: postalCode.trim(),
        city: city.trim(),
        phone: phone.trim() || undefined,
        pflegegrad,
        pflegegradAntragLaeuft,
        krankenkasseArt,
        krankenkasse,
        versicherungsnummer: versicherungsnummer.trim(),
        hatBevollmaechtigten,
        bevollmaechtigterVorname: hatBevollmaechtigten
          ? bevollmaechtigterVorname.trim()
          : undefined,
        bevollmaechtigterNachname: hatBevollmaechtigten
          ? bevollmaechtigterNachname.trim()
          : undefined,
        bevollmaechtigterAdresse: hatBevollmaechtigten
          ? bevollmaechtigterAdresse.trim()
          : undefined,
        bevollmaechtigterTelefon: hatBevollmaechtigten
          ? bevollmaechtigterTelefon.trim()
          : undefined,
        bevollmaechtigterEmail: hatBevollmaechtigten ? bevollmaechtigterEmail.trim() : undefined,
        newsletterOptIn,
        agbAccepted: true,
        datenschutzAccepted: true,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="p-6 gap-4">
      <Text className="text-lg font-semibold text-brand-primary-dark dark:text-brand-heading-dark">Konto erstellen</Text>

      <FormField
        label="Vorname"
        value={vorname}
        onChangeText={setVorname}
        autoComplete="given-name"
      />
      <FormField
        label="Nachname"
        value={nachname}
        onChangeText={setNachname}
        autoComplete="family-name"
      />

      <View className="gap-1">
        <Text className="text-sm text-brand-text dark:text-brand-text-dark">Geburtsdatum</Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <FormField
              label="Tag"
              value={geburtstag}
              onChangeText={setGeburtstag}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="TT"
            />
          </View>
          <View className="flex-1">
            <FormField
              label="Monat"
              value={geburtsmonat}
              onChangeText={setGeburtsmonat}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
            />
          </View>
          <View className="flex-1">
            <FormField
              label="Jahr"
              value={geburtsjahr}
              onChangeText={setGeburtsjahr}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="JJJJ"
            />
          </View>
        </View>
      </View>

      <FormField
        label="Straße & Hausnummer"
        value={street}
        onChangeText={setStreet}
        autoComplete="street-address"
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="PLZ"
            value={postalCode}
            onChangeText={setPostalCode}
            autoComplete="postal-code"
            keyboardType="number-pad"
          />
        </View>
        <View className="flex-1">
          <FormField label="Ort" value={city} onChangeText={setCity} />
        </View>
      </View>
      <FormField
        label="Telefonnummer (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <FormField
        label="E-Mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <FormField
        label="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      <View className="border-t border-brand-border pt-4 dark:border-brand-border-dark">
        <SelectField
          label="Pflegegrad"
          value={pflegegrad}
          options={pflegegradOptions}
          onChange={setPflegegrad}
        />
      </View>
      <Checkbox
        checked={pflegegradAntragLaeuft}
        onToggle={() => setPflegegradAntragLaeuft((v) => !v)}
      >
        {pflegegradAntragLabel}
      </Checkbox>

      <View className="gap-2">
        <Text className="text-sm text-brand-text dark:text-brand-text-dark">Krankenversicherung</Text>
        {krankenkasseArtOptions.map((option) => (
          <Checkbox
            key={option.value}
            checked={krankenkasseArt === option.value}
            onToggle={() => setKrankenkasseArt(option.value)}
          >
            {option.label}
          </Checkbox>
        ))}
      </View>

      {krankenkasseArt === "GESETZLICH" && (
        <SelectField
          label="Krankenkasse"
          value={gesetzlicheKasse}
          options={krankenkasseOptions}
          onChange={setGesetzlicheKasse}
        />
      )}
      {krankenkasseArt === "GESETZLICH" && gesetzlicheKasse === ANDERE_KASSE && (
        <FormField
          label="Name der Krankenkasse"
          value={krankenkasseAndere}
          onChangeText={setKrankenkasseAndere}
        />
      )}
      {krankenkasseArt === "PRIVAT" && (
        <FormField
          label="Name der privaten Krankenversicherung"
          value={krankenkassePrivatName}
          onChangeText={setKrankenkassePrivatName}
        />
      )}

      <FormField
        label="Versicherungsnummer"
        value={versicherungsnummer}
        onChangeText={setVersicherungsnummer}
        autoCapitalize="characters"
        placeholder={krankenkasseArt === "GESETZLICH" ? "z. B. A123456789" : undefined}
        hint="Du findest sie auf der Vorderseite deiner Versichertenkarte."
      />

      <View className="border-t border-brand-border pt-4 dark:border-brand-border-dark">
        <Checkbox
          checked={hatBevollmaechtigten}
          onToggle={() => setHatBevollmaechtigten((v) => !v)}
        >
          Ich habe eine/n Bevollmächtigte/n
        </Checkbox>
      </View>

      {hatBevollmaechtigten && (
        <View className="gap-3 rounded-brand-md border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
          <FormField
            label="Vorname"
            value={bevollmaechtigterVorname}
            onChangeText={setBevollmaechtigterVorname}
          />
          <FormField
            label="Nachname"
            value={bevollmaechtigterNachname}
            onChangeText={setBevollmaechtigterNachname}
          />
          <FormField
            label="Adresse"
            value={bevollmaechtigterAdresse}
            onChangeText={setBevollmaechtigterAdresse}
            placeholder="Straße, PLZ, Ort"
          />
          <FormField
            label="Telefonnummer"
            value={bevollmaechtigterTelefon}
            onChangeText={setBevollmaechtigterTelefon}
            keyboardType="phone-pad"
          />
          <FormField
            label="E-Mail"
            value={bevollmaechtigterEmail}
            onChangeText={setBevollmaechtigterEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      )}

      <View className="gap-2 border-t border-brand-border pt-4 dark:border-brand-border-dark">
        <Checkbox checked={newsletterOptIn} onToggle={() => setNewsletterOptIn((v) => !v)}>
          Ich möchte News und Angebote von woodaa per E-Mail erhalten
        </Checkbox>
        <Checkbox checked={agbAccepted} onToggle={() => setAgbAccepted((v) => !v)}>
          Ich akzeptiere die Nutzungsbedingungen
        </Checkbox>
        <Checkbox checked={datenschutzAccepted} onToggle={() => setDatenschutzAccepted((v) => !v)}>
          Ich habe die Datenschutzerklärung gelesen
        </Checkbox>
      </View>

      {error && <Text className="text-sm text-red-600">{error}</Text>}

      <PrimaryButton label="Konto erstellen" loading={submitting} onPress={onSubmit} />

      <Text className="text-center text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
        Bereits ein Konto?{" "}
        <Link href="/login" className="text-brand-accent underline">
          Jetzt anmelden
        </Link>
      </Text>
    </ScrollView>
  );
}
