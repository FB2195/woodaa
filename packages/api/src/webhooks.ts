import { db } from "@woodaa/db";
import type Stripe from "stripe";
import { stripeClient, stripeWebhookSecret } from "./stripe";

// Thin on purpose - the Next.js route (apps/web/app/api/webhooks/stripe)
// only reads the raw body/signature header and forwards them here, so all
// Stripe-specific logic (and its one dependency on @woodaa/db) lives in this
// package rather than in the web app.
export async function handleStripeWebhook(rawBody: string, signature: string): Promise<void> {
  const event = stripeClient().webhooks.constructEvent(
    rawBody,
    signature,
    stripeWebhookSecret(),
  );

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    // updateMany (not update): a replayed/duplicate webhook for an already-
    // BEZAHLT booking, or one whose id doesn't match any booking (shouldn't
    // happen, but harmless), both no-op instead of throwing.
    await db.booking.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { paymentStatus: "BEZAHLT" },
    });
  }
}
