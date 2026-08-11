import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StarRating } from "@/components/StarRating";
import { formatDate } from "@/lib/format";

type Review = {
  id: string;
  reviewerName: string;
  createdAt: string | Date;
  rating: number;
  comment: string | null;
  operatorReply: string | null;
  careRating?: number | null;
  cleanlinessRating?: number | null;
  foodRating?: number | null;
  staffRating?: number | null;
};

const CATEGORY_LABELS = {
  careRating: "Pflege",
  cleanlinessRating: "Sauberkeit",
  foodRating: "Verpflegung",
  staffRating: "Personal",
} as const;

function categoryAverages(reviews: Review[]): { label: string; avg: number }[] {
  return (Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).flatMap((key) => {
    const values = reviews
      .map((r) => r[key])
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return [];
    return [{ label: CATEGORY_LABELS[key], avg: values.reduce((a, b) => a + b, 0) / values.length }];
  });
}

function CategoryBar({ label, avg }: { label: string; avg: number }) {
  return (
    <View>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-sm text-brand-text dark:text-brand-text-dark">{label}</Text>
        <Text className="text-sm font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          {avg.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
        </Text>
      </View>
      <View className="mt-1 h-1.5 rounded-full bg-brand-border dark:bg-brand-border-dark">
        <View
          className="h-1.5 rounded-full bg-brand-accent"
          style={{ width: `${(avg / 5) * 100}%` }}
        />
      </View>
    </View>
  );
}

// Mobile port of apps/web/components/FacilityReviews.tsx.
export function FacilityReviews({
  facilitySlug,
  facilityName,
  reviews,
  avgRating,
  reviewCount,
}: {
  facilitySlug: string;
  facilityName: string;
  reviews: Review[];
  avgRating: number | null;
  reviewCount: number;
}) {
  const categories = categoryAverages(reviews);
  const highlighted = [...reviews]
    .filter((r) => r.comment)
    .sort(
      (a, b) =>
        b.rating - a.rating || new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
    )
    .slice(0, 3);

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        Bewertungen
      </Text>

      {reviewCount > 0 ? (
        <View className="flex-row items-center gap-2">
          <StarRating rating={avgRating ?? 0} />
          <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
            {(avgRating ?? 0).toLocaleString("de-DE", { maximumFractionDigits: 1 })}
          </Text>
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            ({reviewCount} {reviewCount === 1 ? "Bewertung" : "Bewertungen"})
          </Text>
        </View>
      ) : (
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Noch keine Bewertungen.
        </Text>
      )}

      {categories.length > 0 && (
        <View className="gap-4 rounded-brand-lg border border-brand-border p-5 dark:border-brand-border-dark">
          {categories.map((c) => (
            <CategoryBar key={c.label} label={c.label} avg={c.avg} />
          ))}
        </View>
      )}

      {highlighted.length > 0 && (
        <View className="gap-3">
          <Text className="text-sm font-semibold text-brand-text-muted dark:text-brand-text-muted-dark">
            Was Gästen am besten gefallen hat
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
            <View className="flex-row gap-4">
              {highlighted.map((review) => (
                <View
                  key={review.id}
                  className="w-64 rounded-brand-md border border-brand-border p-4 dark:border-brand-border-dark"
                >
                  <Text className="font-medium text-brand-text dark:text-brand-text-dark">
                    {review.reviewerName}
                  </Text>
                  <Text
                    className="mt-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark"
                    numberOfLines={4}
                  >
                    „{review.comment}“
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View className="gap-3">
        {reviews.map((review) => (
          <View
            key={review.id}
            className="rounded-brand-md border border-brand-border px-4 py-3 dark:border-brand-border-dark"
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-medium text-brand-text dark:text-brand-text-dark">
                {review.reviewerName}
              </Text>
              <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                {formatDate(review.createdAt)}
              </Text>
            </View>
            <View className="mt-1">
              <StarRating rating={review.rating} size="sm" />
            </View>
            {review.comment && (
              <Text className="mt-2 text-sm text-brand-text dark:text-brand-text-dark">
                {review.comment}
              </Text>
            )}
            {review.operatorReply && (
              <View className="ml-4 mt-3 rounded-brand-md border-l-2 border-brand-accent bg-brand-background px-4 py-3 dark:bg-brand-background-dark">
                <Text className="text-xs font-semibold text-brand-accent">
                  Antwort von {facilityName}
                </Text>
                <Text className="mt-1 text-sm text-brand-text dark:text-brand-text-dark">
                  {review.operatorReply}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <PrimaryButton
        label="Pflegeheim bewerten"
        variant="secondary"
        onPress={() => router.push(`/einrichtung/${facilitySlug}/bewerten`)}
      />
    </View>
  );
}
