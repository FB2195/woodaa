import { db } from "@woodaa/db";
import type Stripe from "stripe";
import { cancelBooking } from "./availability";
import {
  resolveBookingRecipient,
  sendBookingConfirmationEmail,
  sendBookingFacilityDecisionEmail,
} from "./email";
import { sendPushNotification } from "./push";
import { refundBookingPayment, stripeClient, stripeWebhookSecret } from "./stripe";

// Thin on purpose - the Next.js route (apps/web/app/api/webhooks/stripe)
// only reads the raw body/signature header and forwards them here, so all
// Stripe-specific logic (and its one dependency on @woodaa/db) lives in this
// package rather than in the web app.
export async function handleStripeWebhook(rawBody: string, signature: string): Promise<void> {
  const event = stripeClient().webhooks.constructEvent(rawBody, signature, stripeWebhookSecret());

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
    if (!booking) return;

    // Rare race: the booking got cancelled (and cancelBooking tried to
    // cancel this same PaymentIntent, see availability.ts) concurrently
    // with Stripe capturing the payment, so the cancel lost the race and
    // the charge went through anyway. The unit is already released and
    // won't be reclaimed here - refund instead of confirming a booking
    // that no longer holds a place.
    if (booking.status === "STORNIERT") {
      await refundBookingPayment(db, booking);
      return;
    }

    if (!booking.user) return;
    const { to, recipientName } = resolveBookingRecipient(booking.user);
    const facilityApprovalRequired = booking.facilityApprovalStatus === "AUSSTEHEND";
    await sendBookingConfirmationEmail({
      to,
      recipientName,
      guestName: `${booking.guestFirstName ?? ""} ${booking.guestLastName ?? ""}`.trim(),
      facilityName: booking.facility.name,
      facilitySlug: booking.facility.slug,
      bookingType: booking.bookingType,
      startDate: booking.startDate,
      endDate: booking.endDate,
      facilityApprovalRequired,
    });
    // AUTOMATISCH: payment succeeding is the last thing standing between
    // this booking and being confirmed. MANUELL bookings still need the
    // facility's sign-off - that push fires from operator.ts instead.
    if (!facilityApprovalRequired) {
      await sendPushNotification(
        db,
        booking.user.id,
        "Buchung bestätigt",
        `Deine Buchung bei ${booking.facility.name} wurde bestätigt.`,
        { bookingId: booking.id },
      );
    }
    return;
  }

  // Karte/Klarna/PayPal payment never completed (declined, 3DS abandoned,
  // customer closed the checkout, ...) - the booking must not keep blocking
  // its unit forever just because it's still sitting at paymentStatus
  // AUSSTEHEND (see createBooking/cancelBooking in availability.ts).
  if (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.canceled") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const booking = await db.booking.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { user: true, facility: { select: { name: true, slug: true } } },
    });
    // Already STORNIERT (manual cancel raced ahead, or this is a
    // replayed/duplicate webhook) - nothing left to release.
    if (!booking || booking.status === "STORNIERT") return;

    await cancelBooking(db, booking.id);

    if (booking.user) {
      const { to, recipientName } = resolveBookingRecipient(booking.user);
      await sendBookingFacilityDecisionEmail({
        to,
        recipientName,
        guestName: `${booking.guestFirstName ?? ""} ${booking.guestLastName ?? ""}`.trim(),
        facilityName: booking.facility.name,
        facilitySlug: booking.facility.slug,
        bookingType: booking.bookingType,
        decision: "ZAHLUNG_FEHLGESCHLAGEN",
      });
    }
  }
}
