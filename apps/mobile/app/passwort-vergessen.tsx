import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/app/passwort-vergessen/page.tsx +
// components/ForgotPasswordForm.tsx. Resetting the password itself still
// happens via the emailed link (opened in the phone's browser, same as any
// other device) - this screen only requests that email.
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const forgotPassword = trpc.auth.forgotPassword.useMutation();

  if (forgotPassword.isSuccess) {
    return (
      <View className="flex-1 bg-brand-background p-6 dark:bg-brand-background-dark">
        <View className="rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
          <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
            E-Mail unterwegs
          </Text>
          <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir einen Link zum
            Zurücksetzen des Passworts geschickt. Der Link ist 1 Stunde gültig - öffne ihn auf
            diesem Gerät im Browser.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 p-6"
    >
      <Text className="text-lg font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        Passwort vergessen
      </Text>
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort
        setzen kannst.
      </Text>

      <FormField
        label="E-Mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      {forgotPassword.isError && (
        <Text className="text-sm text-red-600">{forgotPassword.error.message}</Text>
      )}

      <PrimaryButton
        label={forgotPassword.isPending ? "Wird gesendet…" : "Link anfordern"}
        loading={forgotPassword.isPending}
        onPress={() => forgotPassword.mutate({ email: email.trim() })}
      />
    </ScrollView>
  );
}
