import { db } from "@woodaa/db";
import type Stripe from "stripe";
import { resolveBookingRecipient, sendBookingConfirmationEmail } from "./email";
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
    // The `paymentStatus: { not: "BEZAHLT" }` guard makes this the one
    // atomic "did I just cause the AUSSTEHEND -> BEZAHLT transition" check -
    // a replayed/duplicate webhook for an already-BEZAHLT booking gets
    // count 0 and skips the email below instead of sending it twice. Only
    // KARTE/KLARNA/PAYPAL bookings ever carry a stripePaymentIntentId, so
    // this can't match a RECHNUNG/KOSTENUEBERNAHME_KASSE booking (those get
    // their confirmation email immediately at booking.create instead - see
    // there for why).
    const result = await db.booking.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id, paymentStatus: { not: "BEZAHLT" } },
      data: { paymentStatus: "BEZAHLT" },
    });
    if (result.count === 0) return;

    const booking = await db.booking.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { user: true, facility: { select: { name: true, slug: true } } },
    });
    if (!booking?.user) return;

    const { to, recipientName } = resolveBookingRecipient(booking.user);
    await sendBookingConfirmationEmail({
      to,
      recipientName,
      guestName: `${booking.guestFirstName ?? ""} ${booking.guestLastName ?? ""}`.trim(),
      facilityName: booking.facility.name,
      facilitySlug: booking.facility.slug,
      bookingType: booking.bookingType,
      startDate: booking.startDate,
      endDate: booking.endDate,
      facilityApprovalRequired: booking.facilityApprovalStatus === "AUSSTEHEND",
    });
  }
}
