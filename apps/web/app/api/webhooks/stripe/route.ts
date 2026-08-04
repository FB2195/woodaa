import { handleStripeWebhook } from "@woodaa/api";
import { NextResponse } from "next/server";

// Stripe signs the raw, unparsed body - req.text() (not req.json()) is
// required for handleStripeWebhook's signature verification to pass.
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();
  try {
    await handleStripeWebhook(rawBody, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
