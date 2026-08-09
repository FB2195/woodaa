import { MAX_DOCUMENT_BYTES } from "@woodaa/validators";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/components/booking/KostenuebernahmeUpload.tsx:
// same presigned-PUT flow (request -> PUT the file bytes -> confirm), a
// local "file://" URI can be read into a Blob via fetch() in React Native
// the same way a browser reads a File, so the PUT step is unchanged.
export function KostenuebernahmeUpload({ bookingId }: { bookingId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const requestUpload = trpc.booking.requestKostenuebernahmeUpload.useMutation();
  const confirmUpload = trpc.booking.confirmKostenuebernahmeUpload.useMutation();

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
      const { uploadUrl, key } = await requestUpload.mutateAsync({ bookingId });
      const fileBlob = await (await fetch(file.uri)).blob();
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: fileBlob,
        headers: { "Content-Type": "application/pdf" },
      });
      if (!putRes.ok) {
        throw new Error("Upload fehlgeschlagen.");
      }
      await confirmUpload.mutateAsync({ bookingId, key });
      setUploaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Da ist etwas schiefgelaufen.");
    } finally {
      setUploading(false);
    }
  }

  if (uploaded) {
    return (
      <Text className="mt-3 text-sm text-brand-accent">
        Kostenübernahmebestätigung hochgeladen - die Einrichtung prüft sie und gibt die Buchung
        frei.
      </Text>
    );
  }

  return (
    <View className="mt-3 gap-2 rounded-brand-md bg-brand-background p-3 dark:bg-brand-background-dark">
      <Text className="text-sm text-brand-text dark:text-brand-text-dark">
        Bitte lade die Kostenübernahmebestätigung deiner Pflegekasse hoch, damit die Einrichtung
        die Buchung freigeben kann.
      </Text>
      <PrimaryButton
        label={uploading ? "Wird hochgeladen…" : "PDF hochladen"}
        variant="secondary"
        loading={uploading}
        onPress={() => void pickAndUpload()}
      />
      {error && <Text className="text-sm text-red-600">{error}</Text>}
    </View>
  );
}
