import { ActivityIndicator, Pressable, Text } from "react-native";

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={
        variant === "primary"
          ? `items-center rounded-brand-md bg-brand-accent px-6 py-3 ${isDisabled ? "opacity-50" : ""}`
          : `items-center rounded-brand-md border border-brand-border bg-brand-surface px-6 py-3 dark:border-brand-border-dark dark:bg-brand-surface-dark ${isDisabled ? "opacity-50" : ""}`
      }
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#3E4A2B"} />
      ) : (
        <Text
          className={
            variant === "primary"
              ? "text-base font-semibold text-white"
              : "text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark"
          }
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
