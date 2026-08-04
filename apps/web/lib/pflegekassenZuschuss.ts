import type { BookingType, Pflegegrad } from "@woodaa/validators";

// Amtliche Pauschalbeträge der Pflegeversicherung (SGB XI), Stand 2026 -
// recherchiert und quer geprüft anhand mehrerer Quellen (u. a.
// Bundesgesundheitsministerium-Übersicht "Leistungsansprüche der
// Versicherten im Jahr 2026", Diakonie, betanet, pflege.net). Diese Zahlen
// ändern sich mit jeder Pflegereform - der Hinweistext im UI weist deshalb
// explizit darauf hin, dass es sich um eine unverbindliche Orientierung
// handelt, keine Zusage der individuellen Pflegekasse.
//
// Pflegegrad 0 (noch keine Einstufung) und 1 erhalten keinen der
// leistungsartspezifischen Pauschalbeträge unten - nur den
// Entlastungsbetrag, der für alle Pflegegrade 1-5 gilt.
const ENTLASTUNGSBETRAG_CENTS = 13_100; // 131 €/Monat, PG 1-5

// Vollstationäre Aufnahme: monatlicher Pauschalbetrag zu den
// pflegebedingten Aufwendungen. Zusätzlich zahlt die Pflegekasse einen mit
// der Wohndauer steigenden "Leistungszuschlag" (15/30/50/75 % je nach
// Aufenthaltsdauer) auf den verbleibenden pflegebedingten Eigenanteil -
// das lässt sich ohne die Kostenaufschlüsselung der Einrichtung
// (Pflegekosten vs. Unterkunft/Verpflegung/Investitionskosten) nicht exakt
// berechnen, deshalb fließt nur der Pauschalbetrag in die Berechnung ein
// und der Leistungszuschlag wird als zusätzlicher Hinweis angezeigt.
const VOLLSTATIONAER_CENTS: Partial<Record<Pflegegrad, number>> = {
  2: 80_500,
  3: 131_900,
  4: 185_500,
  5: 209_600,
};

// Tages- und Nachtpflege (teilstationär): eigenes monatliches Budget,
// zusätzlich zu Pflegegeld/Pflegesachleistung nutzbar.
const TAGES_NACHTPFLEGE_CENTS: Partial<Record<Pflegegrad, number>> = {
  2: 72_100,
  3: 135_700,
  4: 168_500,
  5: 208_500,
};

// Kurzzeitpflege: kein monatlicher, sondern ein JAHRES-Budget (seit
// 01.07.2025 gemeinsames Budget mit Verhinderungspflege), nutzbar für bis
// zu 8 Wochen pro Kalenderjahr. Für die monatliche Eigenanteils-Anzeige
// hier anteilig (/12) umgerechnet - siehe Hinweistext im UI, der die
// tatsächliche Jahres-Logik erklärt.
const KURZZEITPFLEGE_JAHRESBUDGET_CENTS = 353_900;

export type ZuschussResult = {
  subsidyCents: number;
  eigenanteilCents: number;
  /** Human-readable note about mechanics not captured by the flat number. */
  note: string | null;
};

export function calculateZuschuss(
  bookingType: BookingType,
  pflegegrad: Pflegegrad,
  monthlyPriceCents: number,
): ZuschussResult {
  if (pflegegrad === 0 || pflegegrad === 1) {
    const subsidyCents = ENTLASTUNGSBETRAG_CENTS;
    return {
      subsidyCents,
      eigenanteilCents: Math.max(0, monthlyPriceCents - subsidyCents),
      note:
        pflegegrad === 0
          ? "Ohne festgestellten Pflegegrad besteht nur Anspruch auf den Entlastungsbetrag - ein Pflegegrad-Antrag lohnt sich."
          : "Pflegegrad 1 hat keinen Anspruch auf die Pauschalbeträge der übrigen Pflegegrade, nur auf den Entlastungsbetrag.",
    };
  }

  if (bookingType === "STATIONAERE_AUFNAHME") {
    const subsidyCents = VOLLSTATIONAER_CENTS[pflegegrad] ?? 0;
    return {
      subsidyCents,
      eigenanteilCents: Math.max(0, monthlyPriceCents - subsidyCents),
      note:
        "Zusätzlich zahlt die Pflegekasse einen mit der Wohndauer steigenden Leistungszuschlag (15 % ab dem 1., 30 % ab dem 13., 50 % ab dem 25., 75 % ab dem 37. Monat) auf den pflegebedingten Eigenanteil - der Eigenanteil sinkt also über die Zeit weiter, hier noch nicht eingerechnet.",
    };
  }

  if (bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") {
    const subsidyCents = TAGES_NACHTPFLEGE_CENTS[pflegegrad] ?? 0;
    return {
      subsidyCents,
      eigenanteilCents: Math.max(0, monthlyPriceCents - subsidyCents),
      note: null,
    };
  }

  // KURZZEITPFLEGE
  const monthlyEquivalentCents = Math.round(KURZZEITPFLEGE_JAHRESBUDGET_CENTS / 12);
  return {
    subsidyCents: monthlyEquivalentCents,
    eigenanteilCents: Math.max(0, monthlyPriceCents - monthlyEquivalentCents),
    note:
      "Kurzzeitpflege wird nicht monatlich, sondern als Jahresbudget von bis zu 3.539 € gezahlt, nutzbar für insgesamt bis zu 8 Wochen im Kalenderjahr - hier anteilig pro Monat umgerechnet, um mit dem Heimpreis vergleichbar zu sein.",
  };
}
