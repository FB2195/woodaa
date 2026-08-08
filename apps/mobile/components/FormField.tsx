import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

type FormFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export function FormField({ label, hint, error, ...inputProps }: FormFieldProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm text-brand-text">{label}</Text>
      <TextInput
        placeholderTextColor="#6B6F62"
        className="rounded-brand-md border border-brand-border bg-brand-surface px-3 py-2.5 text-base text-brand-text"
        {...inputProps}
      />
      {hint && !error && <Text className="text-xs text-brand-text-muted">{hint}</Text>}
      {error && <Text className="text-xs text-red-600">{error}</Text>}
    </View>
  );
}
