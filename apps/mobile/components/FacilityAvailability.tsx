import { useState } from "react";
import type { BookingType } from "@woodaa/validators";
import { Text, View } from "react-native";
import { PflegekassenZuschussRechner } from "@/components/PflegekassenZuschussRechner";
import { SelectField } from "@/components/SelectField";
import { bookingTypeLabels } from "@/lib/bookingTypeLabels";
import { formatDate, formatPriceEuro } from "@/lib/format";

type Capacity = {
  id: string;
  bookingType: BookingType;
  availableSlots: number;
  totalSlots: number;
  monthlyPriceCents: number | null;
  availableFrom: Date | string | null;
  pflegegradPricing: {
    pflegegrad: number;
    dailyRateCents: number | null;
    monthlyRateCents: number | null;
    hourlyRateCents: number | null;
  }[];
};

// RN port of apps/web/components/FacilityAvailability.tsx - a select
// narrows to one booking type first instead of showing every type's full
// card stacked at once (see that file's comment for why: felt too heavy
// with 3-4 types).
export function FacilityAvailability({ capacities }: { capacities: Capacity[] }) {
  const [selected, setSelected] = useState<BookingType | null>(
    capacities.length === 1 ? (capacities[0]?.bookingType ?? null) : null,
  );
  const capacity = capacities.find((c) => c.bookingType === selected);

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-brand-primary-dark dark:text-brand-heading-dark">
        Verfügbarkeit
      </Text>

      <SelectField
        label="Betreuungsart wählen"
        value={selected}
        options={capacities.map((c) => ({ value: c.bookingType, label: bookingTypeLabels[c.bookingType] }))}
        placeholder="Bitte wählen…"
        onChange={setSelected}
      />

      {capacity && (
        <View className="rounded-brand-md border border-brand-border px-4 py-3 dark:border-brand-border-dark">
          <View className="flex-row items-center justify-between">
            <Text className="text-brand-text dark:text-brand-text-dark">
              {bookingTypeLabels[capacity.bookingType]}
            </Text>
            <Text
              className={
                capacity.availableSlots > 0
                  ? "font-semibold text-brand-accent"
                  : "text-brand-text-muted dark:text-brand-text-muted-dark"
              }
            >
              {capacity.availableSlots > 0
                ? `${capacity.availableSlots} von ${capacity.totalSlots} Plätzen frei`
                : "Aktuell belegt"}
            </Text>
          </View>
          <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
            {capacity.monthlyPriceCents !== null
              ? `${formatPriceEuro(capacity.monthlyPriceCents)}/Monat (Heimpreis vor Pflegekassen-Zuschuss)`
              : "Preis auf Anfrage"}
          </Text>

          {capacity.pflegegradPricing.length > 0 && (
            <PflegekassenZuschussRechner
              bookingType={capacity.bookingType}
              pflegegradPricing={capacity.pflegegradPricing}
            />
          )}

          {capacity.bookingType === "STATIONAERE_AUFNAHME" &&
            capacity.availableSlots === 0 &&
            capacity.availableFrom && (
              <Text className="mt-1 text-sm text-brand-text-muted dark:text-brand-text-muted-dark">
                Nächster freier Platz voraussichtlich ab {formatDate(capacity.availableFrom)}
              </Text>
            )}
        </View>
      )}
    </View>
  );
}
