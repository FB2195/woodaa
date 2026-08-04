import type { Agent } from "http";
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
