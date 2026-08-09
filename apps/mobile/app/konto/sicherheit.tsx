import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/app/konto/sicherheit + components/TwoFactorSetup.tsx.
export default function SicherheitScreen() {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();
  const [step, setStep] = useState<"idle" | "setup" | "recovery-codes">("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const setupInitiate = trpc.twoFactor.setupInitiate.useMutation({
    onSuccess: (result) => {
      setQrDataUrl(result.qrDataUrl);
      setSecret(result.secret);
      setStep("setup");
    },
  });
  const setupConfirm = trpc.twoFactor.setupConfirm.useMutation({
    onSuccess: (result) => {
      setRecoveryCodes(result.recoveryCodes);
      setStep("recovery-codes");
      utils.auth.me.invalidate();
    },
    onError: (err) => setError(err.message),
  });
  const disable = trpc.twoFactor.disable.useMutation({
    onSuccess: () => {
      setStep("idle");
      setCode("");
      utils.auth.me.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  if (!meQuery.data) return null;
  const enabled = meQuery.data.twoFactorEnabled;

  if (enabled && step === "idle") {
    return (
      <View className="flex-1 bg-brand-background p-6 dark:bg-brand-background-dark">
        <View className="gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
          <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
            Zwei-Faktor-Authentifizierung
          </Text>
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            2FA ist für dieses Konto aktiv.
          </Text>
          <FormField label="Code zum Deaktivieren" value={code} onChangeText={setCode} autoCapitalize="characters" />
          <PrimaryButton
            label="Deaktivieren"
            variant="secondary"
            loading={disable.isPending}
            onPress={() => {
              setError(null);
              disable.mutate({ code: code.trim() });
            }}
          />
          {error && <Text className="text-sm text-red-600">{error}</Text>}
        </View>
      </View>
    );
  }

  if (step === "recovery-codes") {
    return (
      <View className="flex-1 bg-brand-background p-6 dark:bg-brand-background-dark">
        <View className="gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
          <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
            2FA ist jetzt aktiv
          </Text>
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Speichere diese Wiederherstellungscodes jetzt an einem sicheren Ort - jeder Code
            funktioniert nur einmal und wird nicht erneut angezeigt.
          </Text>
          <View className="flex-row flex-wrap gap-x-4 gap-y-1 rounded-brand-md bg-brand-background p-4 dark:bg-brand-background-dark">
            {recoveryCodes.map((rc) => (
              <Text key={rc} className="w-[45%] font-mono text-sm text-brand-text dark:text-brand-text-dark">
                {rc}
              </Text>
            ))}
          </View>
          <PrimaryButton label="Codes gesichert" onPress={() => setStep("idle")} />
        </View>
      </View>
    );
  }

  if (step === "setup" && qrDataUrl && secret) {
    return (
      <ScrollView
        className="flex-1 bg-brand-background dark:bg-brand-background-dark"
        contentContainerClassName="p-6"
      >
        <View className="gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
          <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
            2FA einrichten
          </Text>
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            Scanne den QR-Code mit einer Authenticator-App (z. B. Google Authenticator, Authy)
            oder gib den Code manuell ein: <Text className="font-mono">{secret}</Text>
          </Text>
          <Image source={{ uri: qrDataUrl }} className="h-40 w-40" />
          <FormField label="Bestätigungscode" value={code} onChangeText={setCode} autoFocus />
          <PrimaryButton
            label="Bestätigen"
            loading={setupConfirm.isPending}
            onPress={() => {
              setError(null);
              setupConfirm.mutate({ code: code.trim() });
            }}
          />
          {error && <Text className="text-sm text-red-600">{error}</Text>}
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-brand-background p-6 dark:bg-brand-background-dark">
      <View className="gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          Zwei-Faktor-Authentifizierung
        </Text>
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          2FA ist für dieses Konto noch nicht aktiv. Schützt dein Konto zusätzlich zum Passwort -
          empfohlen, besonders wenn hier sensible Daten hinterlegt sind.
        </Text>
        <PrimaryButton
          label={setupInitiate.isPending ? "Einen Moment…" : "2FA einrichten"}
          loading={setupInitiate.isPending}
          onPress={() => setupInitiate.mutate()}
        />
      </View>
    </View>
  );
}
