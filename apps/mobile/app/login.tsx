import { Link, router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/AuthContext";

function onSuccess() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)/konto");
  }
}

export default function LoginScreen() {
  const { login, verifyTwoFactor } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (challengeToken) {
    return (
      <ScrollView className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="p-6 gap-4">
        <Text className="text-lg font-semibold text-brand-primary-dark dark:text-brand-heading-dark">Bestätigungscode</Text>
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Gib den 6-stelligen Code aus deiner Authenticator-App ein, oder verwende einen deiner
          Wiederherstellungscodes.
        </Text>
        <FormField
          label="Code"
          value={code}
          onChangeText={setCode}
          autoFocus
          autoCapitalize="characters"
        />
        {error && <Text className="text-sm text-red-600">{error}</Text>}
        <PrimaryButton
          label="Bestätigen"
          loading={submitting}
          onPress={async () => {
            setError(null);
            setSubmitting(true);
            try {
              await verifyTwoFactor(challengeToken, code.trim());
              onSuccess();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="p-6 gap-4">
      <Text className="text-lg font-semibold text-brand-primary-dark dark:text-brand-heading-dark">Anmelden</Text>

      <FormField
        label="E-Mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <FormField
        label="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />

      {error && <Text className="text-sm text-red-600">{error}</Text>}

      <PrimaryButton
        label="Anmelden"
        loading={submitting}
        onPress={async () => {
          setError(null);
          setSubmitting(true);
          try {
            const result = await login(email.trim(), password);
            if (result.twoFactorRequired) {
              setChallengeToken(result.challengeToken);
            } else {
              onSuccess();
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
          } finally {
            setSubmitting(false);
          }
        }}
      />

      <View className="items-center gap-2 pt-2">
        <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          Noch kein Konto?{" "}
          <Link href="/registrieren" className="text-brand-accent underline">
            Jetzt registrieren
          </Link>
        </Text>
      </View>
    </ScrollView>
  );
}
