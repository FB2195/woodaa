import { usePathname } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import type { SupportRequestType } from "@woodaa/validators";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/components/support/SupportRequestForm.tsx.
export function SupportRequestForm({
  type,
  submitLabel,
  phoneRequired = false,
}: {
  type: SupportRequestType;
  submitLabel: string;
  phoneRequired?: boolean;
}) {
  const pathname = usePathname();
  const create = trpc.support.create.useMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  if (create.isSuccess) {
    return (
      <View className="rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
        <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          Danke, deine Nachricht ist da!
        </Text>
        <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Wir melden uns so schnell wie möglich bei dir.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <FormField label="Name" value={name} onChangeText={setName} />
      <FormField label="E-Mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <FormField
        label={`Telefon${phoneRequired ? "" : " (optional)"}`}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <FormField
        label="Nachricht"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={4}
      />

      {create.isError && <Text className="text-sm text-red-600">{create.error.message}</Text>}

      <PrimaryButton
        label={create.isPending ? "Wird gesendet…" : submitLabel}
        loading={create.isPending}
        onPress={() =>
          create.mutate({
            type,
            name,
            email,
            phone: phone.trim() || undefined,
            message,
            pageUrl: pathname,
          })
        }
      />
    </View>
  );
}
