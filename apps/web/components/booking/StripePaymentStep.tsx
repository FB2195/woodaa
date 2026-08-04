"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";
import { getStripe } from "@/lib/stripe";

function PaymentForm({ onConfirmed }: { onConfirmed: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        setPending(true);
        setError(null);
        // redirect: "if_required" - only redirects away for payment methods
        // that need it (e.g. some Klarna flows); card/most cases resolve
        // inline without leaving the page.
        const { error: confirmError } = await stripe.confirmPayment({
          elements,
          redirect: "if_required",
        });
        setPending(false);
        if (confirmError) {
          setError(confirmError.message ?? "Die Zahlung ist fehlgeschlagen.");
          return;
        }
        onConfirmed();
      }}
    >
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || pending}
        className="rounded-brand-md bg-brand-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Zahlung wird verarbeitet…" : "Jetzt bezahlen"}
      </button>
    </form>
  );
}

// Mounted only after booking.create has already reserved the unit and
// returned a Stripe clientSecret (KARTE/KLARNA/PAYPAL) - this step just
// collects and confirms the payment for that already-created booking.
export function StripePaymentStep({
  clientSecret,
  onConfirmed,
}: {
  clientSecret: string;
  onConfirmed: () => void;
}) {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      <PaymentForm onConfirmed={onConfirmed} />
    </Elements>
  );
}
