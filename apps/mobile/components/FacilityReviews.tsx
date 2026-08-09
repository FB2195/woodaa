import { router } from "expo-router";
import { Text, View } from "react-native";
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
};

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
