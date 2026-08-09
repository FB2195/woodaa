import type { BookingType, Pflegegrad } from "@woodaa/validators";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { SelectField } from "@/components/SelectField";
import { formatPriceEuro } from "@/lib/format";
import { pflegegradOptions } from "@/lib/pflegegradLabels";
import {
  calculateKurzzeitpflegeEigenanteil,
  calculateStationaerEigenanteil,
  calculateTagesNachtpflegeEigenanteil,
} from "@/lib/pflegekassenZuschuss";

type PflegegradRate = {
  pflegegrad: number;
  dailyRateCents: number | null;
  monthlyRateCents: number | null;
  hourlyRateCents: number | null;
};

// Mobile port of apps/web/components/PflegekassenZuschussRechner.tsx - same
// calculation functions (lib/pflegekassenZuschuss.ts), RN inputs instead of
// <select>/<input>.
export function PflegekassenZuschussRechner({
  bookingType,
  pflegegradPricing,
}: {
  bookingType: BookingType;
  pflegegradPricing: PflegegradRate[];
}) {
  const { colorScheme } = useColorScheme();
  const [pflegegrad, setPflegegrad] = useState<Pflegegrad | null>(null);
  const [days, setDays] = useState("14");
  const [hoursPerDay, setHoursPerDay] = useState("6");
  const [daysPerMonth, setDaysPerMonth] = useState("20");

  const rate =
    pflegegrad === null ? undefined : pflegegradPricing.find((r) => r.pflegegrad === pflegegrad);
  const numberInputClassName =
    "w-20 rounded-brand-md border border-brand-border bg-brand-surface px-2 py-1.5 text-sm text-brand-text dark:border-brand-border-dark dark:bg-brand-surface-dark dark:text-brand-text-dark";
  const placeholderColor = colorScheme === "dark" ? "#B7C2A8" : "#6B6F62";

  return (
    <View className="mt-2 rounded-brand-md bg-brand-background p-3 dark:bg-brand-background-dark">
      <SelectField
        label="Pflegegrad-Zuschuss berechnen"
        value={pflegegrad}
        options={pflegegradOptions.filter((option) => option.value > 0)}
        placeholder="Pflegegrad wählen…"
        onChange={setPflegegrad}
      />

      {pflegegrad !== null && !rate && (
        <Text className="mt-2 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          Für Pflegegrad {pflegegrad} hat die Einrichtung noch keinen Preis hinterlegt.
        </Text>
      )}

      {pflegegrad !== null &&
        rate &&
        bookingType === "STATIONAERE_AUFNAHME" &&
        (() => {
          const result = calculateStationaerEigenanteil(pflegegrad, rate);
          if (!result) {
            return (
              <Text className="mt-2 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                Für Pflegegrad {pflegegrad} hat die Einrichtung noch keinen Preis hinterlegt.
              </Text>
            );
          }
          return (
            <ResultBlock
              costLabel="Heimpreis"
              costCents={
                rate.monthlyRateCents ?? (rate.dailyRateCents !== null ? rate.dailyRateCents * 30 : 0)
              }
              costSuffix="/Monat"
              subsidyCents={result.subsidyCents}
              eigenanteilCents={result.eigenanteilCents}
              eigenanteilSuffix="/Monat"
              note={result.note}
            />
          );
        })()}

      {pflegegrad !== null &&
        rate?.dailyRateCents !== null &&
        rate?.dailyRateCents !== undefined &&
        bookingType === "KURZZEITPFLEGE" && (
          <>
            <View className="mt-3 flex-row items-center gap-2">
              <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                Anzahl Tage
              </Text>
              <TextInput
                value={days}
                onChangeText={(text) => setDays(text.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholderTextColor={placeholderColor}
                className={numberInputClassName}
              />
            </View>
            {(() => {
              const daysNumber = Math.max(1, Number(days) || 1);
              const result = calculateKurzzeitpflegeEigenanteil(
                pflegegrad,
                rate.dailyRateCents,
                daysNumber,
              );
              return (
                <View className="mt-3 gap-1">
                  <ResultRow label="Verfügbares Jahresbudget" value={formatPriceEuro(result.jahresbudgetCents)} />
                  <ResultRow label={`Kosten (${daysNumber} Tage)`} value={formatPriceEuro(result.totalCostCents)} />
                  <ResultRow
                    label="− Zuschuss der Pflegekasse"
                    value={`−${formatPriceEuro(result.subsidyCents)}`}
                    accent
                  />
                  <View className="flex-row items-center justify-between border-t border-brand-border pt-1 dark:border-brand-border-dark">
                    <Text className="text-sm font-semibold text-brand-heading dark:text-brand-heading-dark">
                      Dein Eigenanteil
                    </Text>
                    <Text className="text-sm font-semibold text-brand-heading dark:text-brand-heading-dark">
                      {formatPriceEuro(result.eigenanteilCents)}
                    </Text>
                  </View>
                  <ResultRow
                    label="Danach noch verfügbares Jahresbudget"
                    value={formatPriceEuro(result.remainingBudgetCents)}
                  />
                  {result.note && (
                    <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                      {result.note}
                    </Text>
                  )}
                  <Disclaimer />
                </View>
              );
            })()}
          </>
        )}

      {pflegegrad !== null &&
        rate?.hourlyRateCents !== null &&
        rate?.hourlyRateCents !== undefined &&
        (bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") && (
          <>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                  Stunden/Tag
                </Text>
                <TextInput
                  value={hoursPerDay}
                  onChangeText={(text) => setHoursPerDay(text.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  placeholderTextColor={placeholderColor}
                  className={numberInputClassName}
                />
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                  Tage/Monat
                </Text>
                <TextInput
                  value={daysPerMonth}
                  onChangeText={(text) => setDaysPerMonth(text.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  placeholderTextColor={placeholderColor}
                  className={numberInputClassName}
                />
              </View>
            </View>
            {(() => {
              const hoursNumber = Math.max(1, Number(hoursPerDay) || 1);
              const daysNumber = Math.max(1, Number(daysPerMonth) || 1);
              const result = calculateTagesNachtpflegeEigenanteil(
                pflegegrad,
                rate.hourlyRateCents,
                hoursNumber,
                daysNumber,
              );
              return (
                <View className="mt-3 gap-1">
                  <ResultRow label="Kosten pro Tag" value={formatPriceEuro(result.dailyCostCents)} />
                  <ResultRow
                    label="− Zuschuss der Pflegekasse"
                    value={`−${formatPriceEuro(result.dailySubsidyCents)}`}
                    accent
                  />
                  <View className="flex-row items-center justify-between border-t border-brand-border pt-1 dark:border-brand-border-dark">
                    <Text className="text-sm font-semibold text-brand-heading dark:text-brand-heading-dark">
                      Dein Eigenanteil pro Tag
                    </Text>
                    <Text className="text-sm font-semibold text-brand-heading dark:text-brand-heading-dark">
                      {formatPriceEuro(result.dailyEigenanteilCents)}
                    </Text>
                  </View>
                  {result.monthlyEigenanteilCents !== null && (
                    <ResultRow
                      label={`Voraussichtlich pro Monat (${daysNumber} Tage)`}
                      value={formatPriceEuro(result.monthlyEigenanteilCents)}
                    />
                  )}
                  {result.note && (
                    <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
                      {result.note}
                    </Text>
                  )}
                  <Disclaimer />
                </View>
              );
            })()}
          </>
        )}
    </View>
  );
}

function ResultRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className={
          accent
            ? "text-sm text-brand-accent"
            : "text-sm text-brand-text-muted dark:text-brand-text-muted-dark"
        }
      >
        {label}
      </Text>
      <Text className={accent ? "text-sm text-brand-accent" : "text-sm text-brand-text-muted dark:text-brand-text-muted-dark"}>
        {value}
      </Text>
    </View>
  );
}

function ResultBlock({
  costLabel,
  costCents,
  costSuffix,
  subsidyCents,
  eigenanteilCents,
  eigenanteilSuffix,
  note,
}: {
  costLabel: string;
  costCents: number;
  costSuffix: string;
  subsidyCents: number;
  eigenanteilCents: number;
  eigenanteilSuffix: string;
  note: string | null;
}) {
  return (
    <View className="mt-3 gap-1">
      <ResultRow label={costLabel} value={`${formatPriceEuro(costCents)}${costSuffix}`} />
      <ResultRow label="− Zuschuss der Pflegekasse" value={`−${formatPriceEuro(subsidyCents)}`} accent />
      <View className="flex-row items-center justify-between border-t border-brand-border pt-1 dark:border-brand-border-dark">
        <Text className="text-sm font-semibold text-brand-heading dark:text-brand-heading-dark">
          Dein Eigenanteil
        </Text>
        <Text className="text-sm font-semibold text-brand-heading dark:text-brand-heading-dark">
          {formatPriceEuro(eigenanteilCents)}
          {eigenanteilSuffix}
        </Text>
      </View>
      {note && (
        <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          {note}
        </Text>
      )}
      <Disclaimer />
    </View>
  );
}

function Disclaimer() {
  return (
    <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
      Unverbindliche Orientierung auf Basis der amtlichen Pauschalbeträge 2026 - alle Angaben ohne
      Gewähr, die tatsächliche Höhe bestätigt eure Pflegekasse.
    </Text>
  );
}
