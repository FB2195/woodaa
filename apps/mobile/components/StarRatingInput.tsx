import { Pressable, Text, View } from "react-native";

export function StarRatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="gap-1">
      <Text className="text-sm text-brand-text dark:text-brand-text-dark">{label}</Text>
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => onChange(star)}>
            <Text
              className={`text-2xl leading-none ${star <= value ? "text-brand-accent" : "text-brand-border dark:text-brand-border-dark"}`}
            >
              ★
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
