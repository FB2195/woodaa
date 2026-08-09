import * as DocumentPicker from "expo-document-picker";
import { MAX_DOCUMENT_BYTES } from "@woodaa/validators";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { trpc } from "@/lib/trpc";

const reviewStatusLabels: Record<"AUSSTEHEND" | "GEPRUEFT" | "ABGELEHNT", string> = {
  AUSSTEHEND: "Wird geprüft",
  GEPRUEFT: "Geprüft und bestätigt",
  ABGELEHNT: "Abgelehnt",
};

// Mobile port of apps/web/app/konto/bevollmaechtigung +
// components/account/VollmachtSection.tsx. Same presigned-PUT upload
// pattern as components/booking/KostenuebernahmeUpload.tsx.
export default function BevollmaechtigungScreen() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.careApplication.myCareProfile.useQuery();
  const [careRecipientName, setCareRecipientName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const updateProfile = trpc.careApplication.updateCareProfile.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });
  const requestUpload = trpc.careApplication.requestVollmachtUpload.useMutation();
  const confirmUpload = trpc.careApplication.confirmVollmachtUpload.useMutation({
    onSuccess: () => utils.careApplication.myCareProfile.invalidate(),
  });

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  async function pickAndUpload() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const file = result.assets[0];

    if (file.size !== undefined && file.size > MAX_DOCUMENT_BYTES) {
      setError(`Die Datei darf maximal ${Math.round(MAX_DOCUMENT_BYTES / 1024 / 1024)} MB groß sein.`);
      return;
    }

    setUploading(true);
    try {
      const { uploadUrl, key } = await requestUpload.mutateAsync();
      const fileBlob = await (await fetch(file.uri)).blob();
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: fileBlob,
        headers: { "Content-Type": "application/pdf" },
      });
      if (!putRes.ok) {
        throw new Error("Upload fehlgeschlagen.");
      }
      await confirmUpload.mutateAsync({ key });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    } finally {
      setUploading(false);
    }
  }

  const nameValue = careRecipientName ?? data.careRecipientName ?? "";

  return (
    <ScrollView
      className="flex-1 bg-brand-background dark:bg-brand-background-dark"
      contentContainerClassName="gap-4 p-6"
    >
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        Buchst du für eine andere Person (z. B. deine Eltern)? Lade eine Vollmacht hoch - wir
        prüfen sie, danach kannst du in ihrem Namen buchen. Jede Buchung von diesem Konto wird
        zusätzlich von unserem Team geprüft, bevor sie endgültig bestätigt wird.
      </Text>

      {data.isBevollmaechtigt && data.vollmachtReviewStatus && (
        <Text
          className={`text-sm font-medium ${
            data.vollmachtReviewStatus === "GEPRUEFT"
              ? "text-brand-accent"
              : data.vollmachtReviewStatus === "ABGELEHNT"
                ? "text-red-600"
                : "text-brand-text-muted dark:text-brand-text-muted-dark"
          }`}
        >
          Vollmacht: {reviewStatusLabels[data.vollmachtReviewStatus]}
        </Text>
      )}

      <View className="gap-3 rounded-brand-lg border border-brand-border bg-brand-surface p-4 dark:border-brand-border-dark dark:bg-brand-surface-dark">
        <FormField
          label="Name der Person, für die du buchst"
          value={nameValue}
          onChangeText={setCareRecipientName}
          placeholder="z. B. Erika Musterfrau"
          onBlur={() => {
            const value = nameValue.trim();
            if (value && value !== data.careRecipientName) {
              updateProfile.mutate({ careRecipientName: value });
            }
          }}
        />

        <PrimaryButton
          label={
            uploading
              ? "Wird hochgeladen…"
              : data.isBevollmaechtigt
                ? "Vollmacht erneut hochladen"
                : "Vollmacht hochladen (PDF)"
          }
          loading={uploading}
          onPress={() => void pickAndUpload()}
        />

        {error && <Text className="text-sm text-red-600">{error}</Text>}
      </View>
    </ScrollView>
  );
}
