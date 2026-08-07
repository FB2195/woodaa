import type { Agent } from "http";
import type { PaymentStatus, PrismaClient } from "@prisma/client";
import { HttpsProxyAgent } from "https-proxy-agent";
import Stripe from "stripe";

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
// payment (operator.rejectBooking, admin.rejectBookingAdmin, booking.cancel/
// myCancel). The booking is always already STORNIERT by the time this runs
// (cancelBooking commits in its own transaction first), so a failed refund
// here can't be rolled back into "still booked" - instead it's recorded on
// refundFailedAt for staff to find and rethrown so the caller still sees the
// mutation fail.
export async function refundBookingPayment(
  db: PrismaClient,
  booking: { id: string; paymentStatus: PaymentStatus | null; stripePaymentIntentId: string | null },
): Promise<void> {
  if (booking.paymentStatus !== "BEZAHLT" || !booking.stripePaymentIntentId) {
    return;
  }
  try {
    await stripeClient().refunds.create({ payment_intent: booking.stripePaymentIntentId });
  } catch (err) {
    console.error(`Stripe-Rückerstattung fehlgeschlagen für Buchung ${booking.id}:`, err);
    await db.booking.update({ where: { id: booking.id }, data: { refundFailedAt: new Date() } });
    throw err;
  }
}
