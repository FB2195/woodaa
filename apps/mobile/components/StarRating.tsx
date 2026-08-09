import { Text, View } from "react-native";

// Mobile port of apps/web/components/StarRating.tsx - same partial-fill
// overlay trick (a muted 5-star baseline with an accent-colored copy
// clipped to `rating/5` width on top) works identically in RN since View
// supports absolute positioning, overflow: hidden and percentage widths.
export function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const clamped = Math.max(0, Math.min(5, rating));
  const fontSize = size === "sm" ? 14 : 18;

  return (
    <View style={{ position: "relative" }}>
      <Text
        style={{ fontSize }}
        className="leading-none text-brand-border dark:text-brand-border-dark"
      >
        ★★★★★
      </Text>
      <View
        style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${(clamped / 5) * 100}%`, overflow: "hidden" }}
      >
        <Text style={{ fontSize }} className="leading-none text-brand-accent">
          ★★★★★
        </Text>
      </View>
    </View>
  );
}
