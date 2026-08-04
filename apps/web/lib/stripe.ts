import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | undefined;

// Lazy singleton - loadStripe() fetches Stripe.js from js.stripe.com on
// first call, so this should only run once per page, on demand (not for
// every visitor of a facility page, most of whom never open the payment
// step).
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}
