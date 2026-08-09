import { useColorScheme } from "nativewind";
import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

type FormFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export function FormField({ label, hint, error, ...inputProps }: FormFieldProps) {
  const { colorScheme } = useColorScheme();

  return (
    <View className="gap-1">
      <Text className="text-sm text-brand-text dark:text-brand-text-dark">{label}</Text>
      <TextInput
        placeholderTextColor={colorScheme === "dark" ? "#B7C2A8" : "#6B6F62"}
        className="rounded-brand-md border border-brand-border bg-brand-surface px-3 py-2.5 text-base text-brand-text dark:border-brand-border-dark dark:bg-brand-surface-dark dark:text-brand-text-dark"
        {...inputProps}
      />
      {hint && !error && (
        <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          {hint}
        </Text>
      )}
      {error && <Text className="text-xs text-red-600">{error}</Text>}
    </View>
  );
}
