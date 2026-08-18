import type { Agent } from "http";
import type { PaymentStatus, PrismaClient } from "@prisma/client";
import { HttpsProxyAgent } from "https-proxy-agent";
import Stripe from "stripe";
import { reportError } from "./errorReporting";

// Lazy singleton, same pattern as r2Client() - importing this file shouldn't
// hard-crash a process that never actually touches payments (e.g. local dev
// without a Stripe test key configured yet).
let client: Stripe | undefined;

export function stripeClient(): Stripe {
  if (!client) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Missing required env var STRIPE_SECRET_KEY");
    }
    // Stripe's default fetch-based HTTP client only tunnels through
    // HTTPS_PROXY when the runtime opts in (Node's undici EnvHttpProxyAgent,
    // NODE_USE_ENV_PROXY=1) - and even then, some HTTP CONNECT proxies
    // reject that fetch-based tunnel while accepting a classic
    // http.Agent-based one (observed in local sandboxed dev). No-op in
    // production, which never sets HTTPS_PROXY.
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy;
    // https-proxy-agent@5's types predate some newer members of Node's
    // http.Agent - functionally compatible (this is the standard way to
    // tunnel a Node http/https client through an HTTP CONNECT proxy), just
    // not type-compatible with @types/node's current Agent shape.
    client = new Stripe(secretKey, {
      httpClient: proxyUrl
        ? Stripe.createNodeHttpClient(new HttpsProxyAgent(proxyUrl) as unknown as Agent)
        : undefined,
    });
  }
  return client;
}

export function stripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing required env var STRIPE_WEBHOOK_SECRET");
  }
  return secret;
}

// Shared by every cancel/reject path that may need to undo a captured
// payment (operator.cancelBooking/rejectBooking, admin.rejectBookingAdmin,
// booking.cancel/myCancel, the webhook's cancelled-while-paying fallback).
// The booking is always already STORNIERT by the time this runs
// (cancelBooking commits in its own transaction first), so a failed refund
// here can't be rolled back into "still booked" - instead it's recorded on
// refundFailedAt for staff to find and rethrown so the caller still sees the
// mutation fail.
//
// Two callers can race on the same booking (double-click, a retried
// request, or two of the cancel/reject procedures above firing for the same
// booking in close succession) - both may read paymentStatus "BEZAHLT"
// before either commits. The updateMany below is the atomic claim: only the
// caller that actually flips BEZAHLT -> REFUNDIERT proceeds to call Stripe,
// the other sees count 0 and no-ops. The Stripe idempotencyKey is a second,
// independent guard against the same booking ever being refunded twice.
export async function refundBookingPayment(
  db: PrismaClient,
  booking: {
    id: string;
    paymentStatus: PaymentStatus | null;
    stripePaymentIntentId: string | null;
  },
): Promise<void> {
  if (booking.paymentStatus !== "BEZAHLT" || !booking.stripePaymentIntentId) {
    return;
  }
  const claimed = await db.booking.updateMany({
    where: { id: booking.id, paymentStatus: "BEZAHLT" },
    data: { paymentStatus: "REFUNDIERT" },
  });
  if (claimed.count === 0) return;
  try {
    await stripeClient().refunds.create(
      { payment_intent: booking.stripePaymentIntentId },
      { idempotencyKey: `refund_${booking.id}` },
    );
  } catch (err) {
    reportError(err, "Stripe-Rückerstattung fehlgeschlagen", { bookingId: booking.id });
    // The refund never went through - revert the claim so paymentStatus
    // keeps reflecting reality (still BEZAHLT, not REFUNDIERT).
    // refundFailedAt is the signal staff use to find and resolve these
    // manually in the Stripe dashboard (see admin.bookingsWithFailedRefunds).
    await db.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: "BEZAHLT", refundFailedAt: new Date() },
    });
    throw err;
  }
}
