import type { PaymentMethod } from "@woodaa/validators";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  KARTE: "Kreditkarte",
  KLARNA: "Klarna",
  PAYPAL: "PayPal",
  RECHNUNG: "Rechnung (über die Einrichtung)",
  KOSTENUEBERNAHME_KASSE: "Kostenübernahme durch die Pflegekasse",
};
