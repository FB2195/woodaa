import type { BookingType, Pflegegrad } from "@woodaa/validators";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { SelectField } from "@/components/SelectField";
import { bookingTypeOptions } from "@/lib/bookingTypeLabels";
import { formatPriceEuro } from "@/lib/format";
import {
  calculateKurzzeitpflegeEigenanteil,
  calculateStationaerEigenanteil,
  calculateTagesNachtpflegeEigenanteil,
} from "@/lib/pflegekassenZuschuss";
import { pflegegradOptions } from "@/lib/pflegegradLabels";

// Mobile port of apps/web/components/PflegeleistungenRechner.tsx - unlike
// PflegekassenZuschussRechner (bound to a specific facility's stored
// pricing), the costs here are freely entered so this works without an
// already-selected Pflegeplatz.
export function PflegeleistungenRechner() {
  const { colorScheme } = useColorScheme();
  const [bookingType, setBookingType] = useState<BookingType>("STATIONAERE_AUFNAHME");
  const [pflegegrad, setPflegegrad] = useState<Pflegegrad | null>(null);

  const [monthlyPriceEuro, setMonthlyPriceEuro] = useState("3200");

  const [dailyRateEuro, setDailyRateEuro] = useState("140");
  const [days, setDays] = useState("14");
  const [alreadyUsedEuro, setAlreadyUsedEuro] = useState("0");

  const [hourlyRateEuro, setHourlyRateEuro] = useState("22");
  const [hoursPerDay, setHoursPerDay] = useState("6");
  const [daysPerMonth, setDaysPerMonth] = useState("20");

  const placeholderColor = colorScheme === "dark" ? "#B7C2A8" : "#6B6F62";
  const inputClassName =
    "w-24 rounded-brand-md border border-brand-border bg-brand-surface px-3 py-2 text-base text-brand-text dark:border-brand-border-dark dark:bg-brand-surface-dark dark:text-brand-text-dark";

  return (
    <View className="gap-4 rounded-brand-lg border border-brand-border bg-brand-surface p-6 dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <SelectField
        label="Pflegeart"
        value={bookingType}
        options={bookingTypeOptions}
        onChange={setBookingType}
      />
      <SelectField
        label="Pflegegrad"
        value={pflegegrad}
        options={pflegegradOptions.filter((option) => option.value > 0)}
        placeholder="Bitte wählen…"
        onChange={setPflegegrad}
      />

      {bookingType === "STATIONAERE_AUFNAHME" && (
        <View className="gap-1">
          <Text className="text-sm text-brand-text dark:text-brand-text-dark">
            Monatliche Heimkosten
          </Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={monthlyPriceEuro}
              onChangeText={(text) => setMonthlyPriceEuro(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholderTextColor={placeholderColor}
              className={inputClassName}
            />
            <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
              €/Monat
            </Text>
          </View>
        </View>
      )}

      {bookingType === "KURZZEITPFLEGE" && (
        <View className="flex-row flex-wrap gap-3">
          <View className="gap-1">
            <Text className="text-sm text-brand-text dark:text-brand-text-dark">Tagessatz</Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={dailyRateEuro}
                onChangeText={(text) => setDailyRateEuro(text.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholderTextColor={placeholderColor}
                className={inputClassName}
              />
              <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                €/Tag
              </Text>
            </View>
          </View>
          <View className="gap-1">
            <Text className="text-sm text-brand-text dark:text-brand-text-dark">Anzahl Tage</Text>
            <TextInput
              value={days}
              onChangeText={(text) => setDays(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholderTextColor={placeholderColor}
              className={inputClassName}
            />
          </View>
          <View className="gap-1">
            <Text className="text-sm text-brand-text dark:text-brand-text-dark">
              Dieses Jahr bereits genutzt (Kurzzeit-/Verhinderungspflege)
            </Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={alreadyUsedEuro}
                onChangeText={(text) => {
                  const digitsOnly = text.replace(/[^0-9]/g, "");
                  setAlreadyUsedEuro(digitsOnly === "" ? "" : String(Number(digitsOnly)));
                }}
                keyboardType="number-pad"
                placeholderTextColor={placeholderColor}
                className={inputClassName}
              />
              <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                €
              </Text>
            </View>
          </View>
        </View>
      )}

      {(bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") && (
        <View className="flex-row flex-wrap gap-3">
          <View className="gap-1">
            <Text className="text-sm text-brand-text dark:text-brand-text-dark">Stundensatz</Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={hourlyRateEuro}
                onChangeText={(text) => setHourlyRateEuro(text.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholderTextColor={placeholderColor}
                className={inputClassName}
              />
              <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                €/Std.
              </Text>
            </View>
          </View>
          <View className="gap-1">
            <Text className="text-sm text-brand-text dark:text-brand-text-dark">Stunden/Tag</Text>
            <TextInput
              value={hoursPerDay}
              onChangeText={(text) => {
                const digitsOnly = text.replace(/[^0-9]/g, "");
                setHoursPerDay(digitsOnly === "" ? "" : String(Math.min(24, Number(digitsOnly))));
              }}
              keyboardType="number-pad"
              placeholderTextColor={placeholderColor}
              className={inputClassName}
            />
          </View>
          <View className="gap-1">
            <Text className="text-sm text-brand-text dark:text-brand-text-dark">Tage/Monat</Text>
            <TextInput
              value={daysPerMonth}
              onChangeText={(text) => {
                const digitsOnly = text.replace(/[^0-9]/g, "");
                setDaysPerMonth(digitsOnly === "" ? "" : String(Math.min(31, Number(digitsOnly))));
              }}
              keyboardType="number-pad"
              placeholderTextColor={placeholderColor}
              className={inputClassName}
            />
          </View>
        </View>
      )}

      {pflegegrad === null && (
        <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
          Wähle einen Pflegegrad, um den voraussichtlichen Zuschuss zu berechnen.
        </Text>
      )}

      {pflegegrad !== null && bookingType === "STATIONAERE_AUFNAHME" && (
        <StationaerResult pflegegrad={pflegegrad} monthlyPriceEuro={monthlyPriceEuro} />
      )}

      {pflegegrad !== null && bookingType === "KURZZEITPFLEGE" && (
        <KurzzeitpflegeResultView
          pflegegrad={pflegegrad}
          dailyRateEuro={dailyRateEuro}
          days={days}
          alreadyUsedEuro={alreadyUsedEuro}
        />
      )}

      {pflegegrad !== null && (bookingType === "TAGESPFLEGE" || bookingType === "NACHTPFLEGE") && (
        <TagesNachtpflegeResultView
          pflegegrad={pflegegrad}
          hourlyRateEuro={hourlyRateEuro}
          hoursPerDay={hoursPerDay}
          daysPerMonth={daysPerMonth}
        />
      )}
    </View>
  );
}

function StationaerResult({
  pflegegrad,
  monthlyPriceEuro,
}: {
  pflegegrad: Pflegegrad;
  monthlyPriceEuro: string;
}) {
  const monthlyPriceCents = Math.round((Number(monthlyPriceEuro) || 0) * 100);
  const result = calculateStationaerEigenanteil(pflegegrad, {
    monthlyRateCents: monthlyPriceCents,
    dailyRateCents: null,
  });
  if (!result) return null;

  return (
    <ResultBlock
      rows={[
        { label: "Heimkosten", value: `${formatPriceEuro(monthlyPriceCents)}/Monat` },
        { label: "− Zuschuss der Pflegekasse", value: `−${formatPriceEuro(result.subsidyCents)}`, accent: true },
      ]}
      eigenanteilLabel="Voraussichtlicher Eigenanteil"
      eigenanteilValue={`${formatPriceEuro(result.eigenanteilCents)}/Monat`}
      note={result.note}
    />
  );
}

function KurzzeitpflegeResultView({
  pflegegrad,
  dailyRateEuro,
  days,
  alreadyUsedEuro,
}: {
  pflegegrad: Pflegegrad;
  dailyRateEuro: string;
  days: string;
  alreadyUsedEuro: string;
}) {
  const daysNumber = Math.max(1, Number(days) || 1);
  const result = calculateKurzzeitpflegeEigenanteil(
    pflegegrad,
    Math.round((Number(dailyRateEuro) || 0) * 100),
    daysNumber,
    Math.round((Number(alreadyUsedEuro) || 0) * 100),
  );

  return (
    <ResultBlock
      rows={[
        {
          label:
            result.alreadyUsedCents > 0
              ? `Jahresbudget (bereits ${formatPriceEuro(result.alreadyUsedCents)} genutzt)`
              : "Verfügbares Jahresbudget",
          value: formatPriceEuro(result.availableBudgetCents),
        },
        { label: `Kosten (${daysNumber} Tage)`, value: formatPriceEuro(result.totalCostCents) },
        { label: "− Zuschuss der Pflegekasse", value: `−${formatPriceEuro(result.subsidyCents)}`, accent: true },
      ]}
      eigenanteilLabel="Voraussichtlicher Eigenanteil"
      eigenanteilValue={formatPriceEuro(result.eigenanteilCents)}
      extraRows={[
        { label: "Danach noch verfügbares Jahresbudget", value: formatPriceEuro(result.remainingBudgetCents) },
      ]}
      note={result.note}
    />
  );
}

function TagesNachtpflegeResultView({
  pflegegrad,
  hourlyRateEuro,
  hoursPerDay,
  daysPerMonth,
}: {
  pflegegrad: Pflegegrad;
  hourlyRateEuro: string;
  hoursPerDay: string;
  daysPerMonth: string;
}) {
  const hoursNumber = Math.max(1, Number(hoursPerDay) || 1);
  const daysNumber = Math.max(1, Number(daysPerMonth) || 1);
  const result = calculateTagesNachtpflegeEigenanteil(
    pflegegrad,
    Math.round((Number(hourlyRateEuro) || 0) * 100),
    hoursNumber,
    daysNumber,
  );

  return (
    <ResultBlock
      rows={[
        { label: "Kosten pro Tag", value: formatPriceEuro(result.dailyCostCents) },
        { label: "− Zuschuss der Pflegekasse", value: `−${formatPriceEuro(result.dailySubsidyCents)}`, accent: true },
      ]}
      eigenanteilLabel="Voraussichtlicher Eigenanteil pro Tag"
      eigenanteilValue={formatPriceEuro(result.dailyEigenanteilCents)}
      extraRows={
        result.monthlyEigenanteilCents !== null
          ? [
              {
                label: `Voraussichtlich pro Monat (${daysNumber} Tage)`,
                value: formatPriceEuro(result.monthlyEigenanteilCents),
              },
            ]
          : []
      }
      note={result.note}
    />
  );
}

type ResultRow = { label: string; value: string; accent?: boolean };

function ResultBlock({
  rows,
  eigenanteilLabel,
  eigenanteilValue,
  extraRows = [],
  note,
}: {
  rows: ResultRow[];
  eigenanteilLabel: string;
  eigenanteilValue: string;
  extraRows?: ResultRow[];
  note: string | null;
}) {
  return (
    <View className="gap-2 border-t border-brand-border pt-4 dark:border-brand-border-dark">
      {rows.map((row) => (
        <View key={row.label} className="flex-row items-center justify-between">
          <Text
            className={
              row.accent
                ? "flex-1 pr-2 text-sm text-brand-accent"
                : "flex-1 pr-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark"
            }
          >
            {row.label}
          </Text>
          <Text className={row.accent ? "text-sm text-brand-accent" : "text-sm text-brand-text-muted dark:text-brand-text-muted-dark"}>
            {row.value}
          </Text>
        </View>
      ))}
      <View className="flex-row items-center justify-between border-t border-brand-border pt-2 dark:border-brand-border-dark">
        <Text className="flex-1 pr-2 text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          {eigenanteilLabel}
        </Text>
        <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
          {eigenanteilValue}
        </Text>
      </View>
      {extraRows.map((row) => (
        <View key={row.label} className="flex-row items-center justify-between">
          <Text className="flex-1 pr-2 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            {row.label}
          </Text>
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            {row.value}
          </Text>
        </View>
      ))}
      {note && (
        <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
          {note}
        </Text>
      )}
      <Text className="mt-1 text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
        Unverbindliche Orientierung auf Basis der amtlichen Pauschalbeträge 2026 - alle Angaben
        ohne Gewähr, die tatsächliche Höhe bestätigt eure Pflegekasse.
      </Text>
    </View>
  );
}
