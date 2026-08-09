import { useStripe } from "@stripe/stripe-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";

// Mobile port of apps/web/components/booking/StripePaymentStep.tsx.
// Stripe's own PaymentSheet UI replaces the web version's <PaymentElement>
// form - same idea (a pre-built, PCI-compliant payment UI mounted with the
// clientSecret from an already-created PaymentIntent), just the native
// SDK's variant of it instead of Stripe.js's web one.
export function StripePaymentStep({
  clientSecret,
  onConfirmed,
}: {
  clientSecret: string;
  onConfirmed: () => void;
}) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: "woodaa",
    }).then(({ error: initError }) => {
      if (cancelled) return;
      if (initError) {
        setError(initError.message);
      } else {
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clientSecret, initPaymentSheet]);

  async function handlePay() {
    setPending(true);
    setError(null);
    const { error: presentError } = await presentPaymentSheet();
    setPending(false);
    if (presentError) {
      if (presentError.code !== "Canceled") {
        setError(presentError.message);
      }
      return;
    }
    onConfirmed();
  }

  return (
    <View className="gap-3">
      <PrimaryButton
        label={pending ? "Zahlung wird verarbeitet…" : "Jetzt bezahlen"}
        loading={pending}
        disabled={!ready}
        onPress={() => void handlePay()}
      />
      {error && <Text className="text-sm text-red-600">{error}</Text>}
    </View>
  );
}
