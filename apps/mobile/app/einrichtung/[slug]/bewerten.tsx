import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { FormField } from "@/components/FormField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StarRatingInput } from "@/components/StarRatingInput";
import { useAuth } from "@/lib/AuthContext";
import { trpc } from "@/lib/trpc";

// Mobile port of apps/web/app/einrichtung/[slug]/bewerten/page.tsx +
// components/ReviewForm.tsx.
export default function ReviewScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const facilityQuery = trpc.facility.bySlug.useQuery({ slug });
  const eligibilityQuery = trpc.review.checkEligibility.useQuery(
    { facilityId: facilityQuery.data?.id ?? "" },
    { enabled: !!facilityQuery.data },
  );
  const createReview = trpc.review.create.useMutation();

  const [rating, setRating] = useState(0);
  const [careRating, setCareRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(user?.name ?? "");
  const [comment, setComment] = useState("");

  const facility = facilityQuery.data;

  if (facilityQuery.isLoading || eligibilityQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background dark:bg-brand-background-dark">
        <ActivityIndicator color="#2F7D4F" />
      </View>
    );
  }

  if (!facility) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6 dark:bg-brand-background-dark">
        <Text className="text-center text-base text-brand-text dark:text-brand-text-dark">
          Diese Einrichtung wurde nicht gefunden.
        </Text>
      </View>
    );
  }

  const eligibility = eligibilityQuery.data;

  return (
    <>
      <Stack.Screen options={{ title: "Bewerten" }} />
      <ScrollView className="flex-1 bg-brand-background dark:bg-brand-background-dark" contentContainerClassName="gap-4 p-6">
        <View>
          <Text className="text-xl font-bold text-brand-primary-dark dark:text-brand-heading-dark">
            Pflegeheim bewerten
          </Text>
          <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            {facility.name}, {facility.street}, {facility.postalCode} {facility.city}
          </Text>
        </View>

        {createReview.isSuccess ? (
          <View className="rounded-brand-lg border border-brand-accent bg-brand-accent/10 p-6">
            <Text className="font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
              Danke für deine Bewertung!
            </Text>
            <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
              Sie wird nach kurzer Prüfung durch unser Team veröffentlicht.
            </Text>
          </View>
        ) : eligibility?.alreadyReviewed ? (
          <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
            <Text className="text-brand-text dark:text-brand-text-dark">
              Du hast diese Einrichtung bereits bewertet. Danke für dein Feedback!
            </Text>
          </View>
        ) : eligibility?.eligible ? (
          <View className="gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
            <StarRatingInput label="Gesamtbewertung *" value={rating} onChange={setRating} />
            <StarRatingInput label="Pflege (optional)" value={careRating} onChange={setCareRating} />
            <StarRatingInput
              label="Sauberkeit (optional)"
              value={cleanlinessRating}
              onChange={setCleanlinessRating}
            />
            <StarRatingInput label="Verpflegung (optional)" value={foodRating} onChange={setFoodRating} />
            <StarRatingInput label="Personal (optional)" value={staffRating} onChange={setStaffRating} />

            <FormField
              label="Name (wird veröffentlicht)"
              value={reviewerName}
              onChangeText={setReviewerName}
            />
            <FormField
              label="Kommentar (optional)"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
            />

            {createReview.isError && (
              <Text className="text-sm text-red-600">{createReview.error.message}</Text>
            )}

            <PrimaryButton
              label={createReview.isPending ? "Wird gesendet…" : "Bewertung abschicken"}
              loading={createReview.isPending}
              disabled={!rating || !reviewerName.trim()}
              onPress={() => {
                if (!rating) return;
                createReview.mutate({
                  facilityId: facility.id,
                  reviewerName: reviewerName.trim(),
                  rating: rating as 1 | 2 | 3 | 4 | 5,
                  careRating: (careRating || undefined) as 1 | 2 | 3 | 4 | 5 | undefined,
                  cleanlinessRating: (cleanlinessRating || undefined) as 1 | 2 | 3 | 4 | 5 | undefined,
                  foodRating: (foodRating || undefined) as 1 | 2 | 3 | 4 | 5 | undefined,
                  staffRating: (staffRating || undefined) as 1 | 2 | 3 | 4 | 5 | undefined,
                  comment: comment.trim() || undefined,
                });
              }}
            />
          </View>
        ) : (
          <View className="rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
            <Text className="text-brand-text dark:text-brand-text-dark">
              Du kannst diese Einrichtung nur bewerten, wenn du sie bereits über woodaa gebucht
              hast. Sobald deine Buchung bestätigt ist, kannst du hier dein Feedback hinterlassen.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
