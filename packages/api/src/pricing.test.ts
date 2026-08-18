import { describe, expect, it } from "vitest";
import {
  cheapestMonthlyEquivalentCents,
  chargeAmountCents,
  monthlyEquivalentCents,
  type PflegegradRate,
} from "./pricing";

const NO_RATE: PflegegradRate = {
  dailyRateCents: null,
  monthlyRateCents: null,
  hourlyRateCents: null,
};

describe("monthlyEquivalentCents", () => {
  it("returns null when no rate was entered at all", () => {
    expect(monthlyEquivalentCents("STATIONAERE_AUFNAHME", undefined)).toBeNull();
  });

  it("prefers the monthly rate for STATIONAERE_AUFNAHME over a daily-rate fallback", () => {
    const rate: PflegegradRate = { ...NO_RATE, monthlyRateCents: 300000, dailyRateCents: 12000 };
    expect(monthlyEquivalentCents("STATIONAERE_AUFNAHME", rate)).toBe(300000);
  });

  it("falls back to dailyRate * 30 for STATIONAERE_AUFNAHME when no monthly rate is set", () => {
    const rate: PflegegradRate = { ...NO_RATE, dailyRateCents: 12000 };
    expect(monthlyEquivalentCents("STATIONAERE_AUFNAHME", rate)).toBe(360000);
  });

  it("returns null for STATIONAERE_AUFNAHME when neither monthly nor daily rate is set", () => {
    expect(monthlyEquivalentCents("STATIONAERE_AUFNAHME", NO_RATE)).toBeNull();
  });

  it("uses dailyRate * 30 for KURZZEITPFLEGE", () => {
    const rate: PflegegradRate = { ...NO_RATE, dailyRateCents: 15000 };
    expect(monthlyEquivalentCents("KURZZEITPFLEGE", rate)).toBe(450000);
  });

  it("ignores monthlyRateCents for KURZZEITPFLEGE (only dailyRate counts)", () => {
    const rate: PflegegradRate = { ...NO_RATE, monthlyRateCents: 999999, dailyRateCents: null };
    expect(monthlyEquivalentCents("KURZZEITPFLEGE", rate)).toBeNull();
  });

  it("uses hourlyRate * 8h * 30 for TAGESPFLEGE/NACHTPFLEGE as a browsing estimate", () => {
    const rate: PflegegradRate = { ...NO_RATE, hourlyRateCents: 1000 };
    expect(monthlyEquivalentCents("TAGESPFLEGE", rate)).toBe(1000 * 8 * 30);
    expect(monthlyEquivalentCents("NACHTPFLEGE", rate)).toBe(1000 * 8 * 30);
  });
});

describe("cheapestMonthlyEquivalentCents", () => {
  it("picks the minimum across all entered Pflegegrad rates", () => {
    const rates: PflegegradRate[] = [
      { ...NO_RATE, monthlyRateCents: 400000 },
      { ...NO_RATE, monthlyRateCents: 250000 },
      { ...NO_RATE, monthlyRateCents: 320000 },
    ];
    expect(cheapestMonthlyEquivalentCents("STATIONAERE_AUFNAHME", rates)).toBe(250000);
  });

  it("ignores Pflegegrade with no usable rate rather than treating them as free", () => {
    const rates: PflegegradRate[] = [NO_RATE, { ...NO_RATE, monthlyRateCents: 280000 }];
    expect(cheapestMonthlyEquivalentCents("STATIONAERE_AUFNAHME", rates)).toBe(280000);
  });

  it("returns null when nothing has a usable rate", () => {
    expect(cheapestMonthlyEquivalentCents("STATIONAERE_AUFNAHME", [NO_RATE, NO_RATE])).toBeNull();
  });
});

describe("chargeAmountCents", () => {
  it("returns null when the facility hasn't entered a rate - callers must not charge 0", () => {
    expect(chargeAmountCents("STATIONAERE_AUFNAHME", undefined, null, null, null)).toBeNull();
  });

  it("charges exactly one month upfront for STATIONAERE_AUFNAHME regardless of dates", () => {
    const rate: PflegegradRate = { ...NO_RATE, monthlyRateCents: 320000 };
    expect(chargeAmountCents("STATIONAERE_AUFNAHME", rate, null, null, null)).toBe(320000);
  });

  it("computes KURZZEITPFLEGE from the real, inclusive day count - not a client-supplied one", () => {
    const rate: PflegegradRate = { ...NO_RATE, dailyRateCents: 15000 };
    const start = new Date("2026-03-01T00:00:00Z");
    const end = new Date("2026-03-05T00:00:00Z"); // 1.-5. inklusiv = 5 Tage
    expect(chargeAmountCents("KURZZEITPFLEGE", rate, start, end, null)).toBe(15000 * 5);
  });

  it("returns null for KURZZEITPFLEGE with no dailyRate entered", () => {
    const rate: PflegegradRate = { ...NO_RATE, monthlyRateCents: 999999 };
    const start = new Date("2026-03-01T00:00:00Z");
    const end = new Date("2026-03-05T00:00:00Z");
    expect(chargeAmountCents("KURZZEITPFLEGE", rate, start, end, null)).toBeNull();
  });

  it("computes TAGESPFLEGE/NACHTPFLEGE from hourlyRate * hoursPerDay * days", () => {
    const rate: PflegegradRate = { ...NO_RATE, hourlyRateCents: 1200 };
    const start = new Date("2026-03-01T00:00:00Z");
    const end = new Date("2026-03-03T00:00:00Z"); // 3 Tage inklusiv
    expect(chargeAmountCents("TAGESPFLEGE", rate, start, end, 6)).toBe(1200 * 6 * 3);
  });

  it("returns null for TAGESPFLEGE/NACHTPFLEGE without hoursPerDay - never silently charge 0 hours", () => {
    const rate: PflegegradRate = { ...NO_RATE, hourlyRateCents: 1200 };
    expect(chargeAmountCents("TAGESPFLEGE", rate, null, null, null)).toBeNull();
    expect(chargeAmountCents("TAGESPFLEGE", rate, null, null, 0)).toBeNull();
  });
});
