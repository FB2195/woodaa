// Mirrors apps/web/lib/stripe.ts's env lookup. Publishable keys are safe to
// ship in a client app (unlike the secret key, which never leaves the
// server) - this can be hardcoded into eas.json's build.preview.env
// alongside EXPO_PUBLIC_API_URL once known, same as any other public
// config value. Until it's set, card/Klarna/PayPal payment is hidden and
// bookings fall back to Rechnung/Kostenübernahme (see BookingScreen).
export function stripePublishableKey(): string | null {
  return process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
}
