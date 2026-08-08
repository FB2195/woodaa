import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export function Checkbox({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-start gap-2">
      <View
        className={`mt-0.5 h-5 w-5 items-center justify-center rounded-brand-sm border ${
          checked ? "border-brand-accent bg-brand-accent" : "border-brand-border bg-brand-surface"
        }`}
      >
        {checked && <Text className="text-xs font-bold text-white">✓</Text>}
      </View>
      <Text className="flex-1 text-sm text-brand-text">{children}</Text>
    </Pressable>
  );
}
