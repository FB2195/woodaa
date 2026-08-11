import { useState } from "react";
import type { BookingType } from "@woodaa/validators";
import { Text, View } from "react-native";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SelectField } from "@/components/SelectField";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { trpc } from "@/lib/trpc";

// RN port of apps/web/components/BookingRequestForm.tsx.
export function FacilityBookingRequestForm({
  facilityId,
  availableBookingTypes,
}: {
  facilityId: string;
  availableBookingTypes: BookingType[];
}) {
  const [bookingType, setBookingType] = useState<BookingType | null>(
    availableBookingTypes[0] ?? null,
  );
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [message, setMessage] = useState("");
  const createRequest = trpc.bookingRequest.create.useMutation();

  if (availableBookingTypes.length === 0) {
    return (
      <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Diese Einrichtung hat aktuell keine freien Plätze.
        </Text>
      </View>
    );
  }

  if (createRequest.isSuccess) {
    return (
      <View className="rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
        <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          Anfrage gesendet!
        </Text>
        <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Die Einrichtung meldet sich in der Regel innerhalb weniger Tage direkt bei dir.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        Anfrage senden
      </Text>

      <SelectField
        label="Pflegeart"
        value={bookingType}
        options={availableBookingTypes.map((type) => ({ value: type, label: bookingTypeLabels[type] }))}
        onChange={setBookingType}
      />
      <FormField label="Name" value={requesterName} onChangeText={setRequesterName} />
      <FormField
        label="E-Mail"
        value={requesterEmail}
        onChangeText={setRequesterEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormField
        label="Telefon (optional)"
        value={requesterPhone}
        onChangeText={setRequesterPhone}
        keyboardType="phone-pad"
      />
      <FormField
        label="Nachricht (optional)"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
      />

      {createRequest.isError && (
        <Text className="text-sm text-red-600">Da ist etwas schiefgelaufen. Bitte versuch es noch einmal.</Text>
      )}

      <PrimaryButton
        label={createRequest.isPending ? "Wird gesendet…" : "Anfrage senden"}
        loading={createRequest.isPending}
        disabled={!bookingType || !requesterName.trim() || !requesterEmail.trim()}
        onPress={() => {
          if (!bookingType) return;
          createRequest.mutate({
            facilityId,
            bookingType,
            requesterName: requesterName.trim(),
            requesterEmail: requesterEmail.trim(),
            requesterPhone: requesterPhone.trim() || undefined,
            message: message.trim() || undefined,
          });
        }}
      />
    </View>
  );
}
