import { useState } from "react";
import { FlatList, Modal, Pressable, SafeAreaView, Text, View } from "react-native";

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  placeholder = "Bitte wählen",
  onChange,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  placeholder?: string;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className="gap-1">
      <Text className="text-sm text-brand-text dark:text-brand-text-dark">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="rounded-brand-md border border-brand-border bg-brand-surface px-3 py-2.5 dark:border-brand-border-dark dark:bg-brand-surface-dark"
      >
        <Text
          className={
            selected
              ? "text-base text-brand-text dark:text-brand-text-dark"
              : "text-base text-brand-text-muted dark:text-brand-text-muted-dark"
          }
        >
          {selected?.label ?? placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
        <SafeAreaView className="max-h-[70%] rounded-t-brand-lg bg-brand-surface dark:bg-brand-surface-dark">
          <View className="flex-row items-center justify-between border-b border-brand-border px-4 py-3 dark:border-brand-border-dark">
            <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
              {label}
            </Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text className="text-brand-accent">Schließen</Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(option) => String(option.value)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className="border-b border-brand-border px-4 py-3 dark:border-brand-border-dark"
              >
                <Text
                  className={
                    item.value === value
                      ? "text-base font-semibold text-brand-accent"
                      : "text-base text-brand-text dark:text-brand-text-dark"
                  }
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
