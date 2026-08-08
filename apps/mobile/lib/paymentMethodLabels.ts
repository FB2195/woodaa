import type { PaymentMethod } from "@woodaa/validators";

// Kept in sync with apps/web/lib/paymentMethodLabels.ts.
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  KARTE: "Kreditkarte",
  KLARNA: "Klarna",
  PAYPAL: "PayPal",
  RECHNUNG: "Rechnung (über die Einrichtung)",
  KOSTENUEBERNAHME_KASSE: "Kostenübernahme durch die Pflegekasse",
};
