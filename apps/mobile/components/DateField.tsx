import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

function formatDisplay(date: Date | null): string {
  if (!date) return "Datum wählen";
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// yyyy-mm-dd, matching the format the web app's native <input type="date">
// produces (see apps/web/app/suche/page.tsx#parseDateParam) - tRPC's
// z.coerce.date() on the server accepts this directly.
export function toDateParam(date: Date | null): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

// RN has no native <input type="date"> - @react-native-community/datetimepicker
// renders the platform picker natively (Android: an OS dialog that opens/closes
// itself; iOS: an inline wheel we wrap in a bottom-sheet Modal with a "Fertig"
// button since iOS's "default" display mode doesn't self-contain like Android's).
export function DateField({
  label,
  value,
  onChange,
  minimumDate,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minimumDate?: Date;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-1">
      <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="rounded-brand-md border border-brand-border bg-brand-background px-3 py-2.5 dark:border-brand-border-dark dark:bg-brand-background-dark"
      >
        <Text
          className={
            value
              ? "text-base text-brand-text dark:text-brand-text-dark"
              : "text-base text-brand-text-muted dark:text-brand-text-muted-dark"
          }
        >
          {formatDisplay(value)}
        </Text>
      </Pressable>

      {open && Platform.OS === "android" && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={(event, selected) => {
            setOpen(false);
            if (event.type === "set" && selected) onChange(selected);
          }}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
          <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
          <View className="rounded-t-brand-lg bg-brand-surface p-4 dark:bg-brand-surface-dark">
            <View className="flex-row items-center justify-between pb-2">
              <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
                {label}
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text className="font-semibold text-brand-accent">Fertig</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={value ?? new Date()}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              onChange={(_event, selected) => {
                if (selected) onChange(selected);
              }}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}
