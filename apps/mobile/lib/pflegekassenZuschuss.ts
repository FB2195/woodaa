import type { Pflegegrad } from "@woodaa/validators";

// Kept in sync with apps/web/lib/pflegekassenZuschuss.ts (pure business
// logic, no DOM/React dependency - safe to duplicate verbatim rather than
// pulling in a shared package for one file).
//
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

// Kurzzeitpflege: kein monatliches, sondern ein JAHRES-Budget (seit
// 01.07.2025 gemeinsames Budget mit Verhinderungspflege), nutzbar für bis
// zu 8 Wochen (56 Tage) pro Kalenderjahr. Innerhalb dieser 56 Tage lässt
// sich das Budget frei einteilen - ein zweiwöchiger Aufenthalt darf also
// ohne Weiteres das komplette Budget aufbrauchen, es gibt keine
// Tages-Deckelung des Betrags, nur eine Tages-Deckelung der nutzbaren Zeit.
const KURZZEITPFLEGE_JAHRESBUDGET_CENTS = 353_900;
const KURZZEITPFLEGE_MAX_TAGE_PRO_JAHR = 56;

export type ZuschussResult = {
  subsidyCents: number;
  eigenanteilCents: number;
  /** Human-readable note about mechanics not captured by the flat number. */
  note: string | null;
};

export type StationaerRates = {
  dailyRateCents: number | null;
  monthlyRateCents: number | null;
};

// Vollstationäre Aufnahme rechnet monatlich. monthlyRateCents ist die
// echte, vom Heim je Pflegegrad hinterlegte Monatspauschale
// (CapacityPflegegradPricing) - falls das Heim nur einen Tagessatz
// hinterlegt hat (z. B. für die Abrechnung eines Teilmonats bei
// unterjährigem Einzug), wird ×30 als Näherung verwendet.
export function calculateStationaerEigenanteil(
  pflegegrad: Pflegegrad,
  rates: StationaerRates,
): ZuschussResult | null {
  const monthlyPriceCents = rates.monthlyRateCents ?? (rates.dailyRateCents !== null ? rates.dailyRateCents * 30 : null);
  if (monthlyPriceCents === null) return null;

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

  const subsidyCents = VOLLSTATIONAER_CENTS[pflegegrad] ?? 0;
  return {
    subsidyCents,
    eigenanteilCents: Math.max(0, monthlyPriceCents - subsidyCents),
    note:
      "Zusätzlich zahlt die Pflegekasse einen mit der Wohndauer steigenden Leistungszuschlag (15 % ab dem 1., 30 % ab dem 13., 50 % ab dem 25., 75 % ab dem 37. Monat) auf den pflegebedingten Eigenanteil - der Eigenanteil sinkt also über die Zeit weiter, hier noch nicht eingerechnet.",
  };
}

export type KurzzeitpflegeResult = {
  jahresbudgetCents: number;
  totalCostCents: number;
  subsidyCents: number;
  remainingBudgetCents: number;
  eigenanteilCents: number;
  note: string | null;
};

// Kurzzeitpflege rechnet über den tatsächlichen Aufenthalt (in Tagen), nicht
// monatlich - und das Jahresbudget lässt sich frei auf diesen Aufenthalt
// anwenden, nicht nur anteilig pro Tag. dailyRateCents ist der echte, vom
// Heim je Pflegegrad hinterlegte Tagessatz (CapacityPflegegradPricing).
export function calculateKurzzeitpflegeEigenanteil(
  pflegegrad: Pflegegrad,
  dailyRateCents: number,
  days: number,
): KurzzeitpflegeResult {
  const totalCostCents = Math.round(dailyRateCents * days);

  if (pflegegrad === 0 || pflegegrad === 1) {
    // PG 0/1 haben keinen Anspruch auf das Kurzzeitpflege-Jahresbudget, nur
    // auf den (hier anteilig auf die Tage umgerechneten) Entlastungsbetrag.
    const subsidyCents = Math.round((ENTLASTUNGSBETRAG_CENTS / 30) * days);
    return {
      jahresbudgetCents: 0,
      totalCostCents,
      subsidyCents,
      remainingBudgetCents: 0,
      eigenanteilCents: Math.max(0, totalCostCents - subsidyCents),
      note:
        pflegegrad === 0
          ? "Ohne festgestellten Pflegegrad besteht kein Anspruch auf das Kurzzeitpflege-Jahresbudget, nur auf den anteiligen Entlastungsbetrag - ein Pflegegrad-Antrag lohnt sich."
          : "Pflegegrad 1 hat keinen Anspruch auf das Kurzzeitpflege-Jahresbudget, nur auf den anteiligen Entlastungsbetrag.",
    };
  }

  const gedeckteTage = Math.min(days, KURZZEITPFLEGE_MAX_TAGE_PRO_JAHR);
  const subsidyCents = Math.min(
    Math.round(dailyRateCents * gedeckteTage),
    KURZZEITPFLEGE_JAHRESBUDGET_CENTS,
  );
  return {
    jahresbudgetCents: KURZZEITPFLEGE_JAHRESBUDGET_CENTS,
    totalCostCents,
    subsidyCents,
    remainingBudgetCents: Math.max(0, KURZZEITPFLEGE_JAHRESBUDGET_CENTS - subsidyCents),
    eigenanteilCents: Math.max(0, totalCostCents - subsidyCents),
    note:
      days > KURZZEITPFLEGE_MAX_TAGE_PRO_JAHR
        ? `Das Jahresbudget deckt nur bis zu ${KURZZEITPFLEGE_MAX_TAGE_PRO_JAHR} Tage (8 Wochen) Kurzzeitpflege pro Kalenderjahr - für die ${days - KURZZEITPFLEGE_MAX_TAGE_PRO_JAHR} Tage darüber hinaus zahlt die Kasse aus diesem Budget nichts mehr dazu.`
        : "Das Budget lässt sich frei einteilen - es gibt keine Tages-Deckelung des Betrags, du kannst es auch komplett für einen kürzeren Aufenthalt nutzen. Ist es bereits (teilweise) für andere Zeiträume in diesem Jahr verbraucht, fällt der tatsächliche Zuschuss entsprechend niedriger aus.",
  };
}

export type TagesNachtpflegeResult = {
  dailyCostCents: number;
  dailySubsidyCents: number;
  dailyEigenanteilCents: number;
  monthlyCostCents: number | null;
  monthlyEigenanteilCents: number | null;
  note: string | null;
};

// Tages-/Nachtpflege wird stundenweise abgerechnet, nicht tageweise -
// hourlyRateCents ist der echte, vom Heim je Pflegegrad hinterlegte
// Stundensatz (CapacityPflegegradPricing). Der monatliche Kassen-Zuschuss
// (TAGES_NACHTPFLEGE_CENTS) wird für die tägliche Anzeige anteilig auf 30
// Tage umgelegt - daysPerMonth ist optional und steuert nur, ob zusätzlich
// eine hochgerechnete Monatssumme gezeigt wird.
export function calculateTagesNachtpflegeEigenanteil(
  pflegegrad: Pflegegrad,
  hourlyRateCents: number,
  hoursPerDay: number,
  daysPerMonth?: number,
): TagesNachtpflegeResult {
  const dailyCostCents = Math.round(hourlyRateCents * hoursPerDay);
  const monthlyBudgetCents =
    pflegegrad === 0 || pflegegrad === 1 ? ENTLASTUNGSBETRAG_CENTS : (TAGES_NACHTPFLEGE_CENTS[pflegegrad] ?? 0);
  const dailySubsidyCents = Math.min(
    Math.round(monthlyBudgetCents / 30),
    dailyCostCents,
  );
  const dailyEigenanteilCents = Math.max(0, dailyCostCents - dailySubsidyCents);

  return {
    dailyCostCents,
    dailySubsidyCents,
    dailyEigenanteilCents,
    monthlyCostCents: daysPerMonth ? dailyCostCents * daysPerMonth : null,
    monthlyEigenanteilCents: daysPerMonth ? dailyEigenanteilCents * daysPerMonth : null,
    note:
      pflegegrad === 0 || pflegegrad === 1
        ? "Ohne Pflegegrad 2-5 besteht kein Anspruch auf das Tages-/Nachtpflege-Budget, nur auf den (hier anteilig auf den Tag umgerechneten) Entlastungsbetrag."
        : null,
  };
}
