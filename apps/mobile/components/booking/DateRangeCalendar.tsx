import { useState } from "react";
import { Pressable, Text, View } from "react-native";

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseISODate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, count: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}

// Montag=0 .. Sonntag=6, statt JS' Sonntag=0 .. Samstag=6 - deutsche
// Kalenderwochen beginnen montags. Gleiche Logik wie
// apps/web/components/booking/DateRangeCalendar.tsx.
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function buildMonthGrid(monthStart: Date): (Date | null)[] {
  const leadingBlanks = mondayIndex(monthStart);
  const daysInMonth = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
  ).getUTCDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const monthFormatter = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });

// RN-Port von apps/web/components/booking/DateRangeCalendar.tsx - gleiche
// Klick-Logik (ein Klick setzt "Von", der nächste setzt "Bis"), damit sich
// die Buchungsstrecke auf App und Web identisch anfühlt. Anders als im Web
// arbeitet diese Version direkt mit Date-Objekten statt ISO-Strings, weil
// der Rest der mobilen Buchungsstrecke (siehe DateField.tsx) das auch tut.
export function DateRangeCalendar({
  startDate,
  endDate,
  onChange,
  disabled,
}: {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (startDate: Date | null, endDate: Date | null) => void;
  disabled?: boolean;
}) {
  const startIso = startDate ? toISODate(startDate) : "";
  const endIso = endDate ? toISODate(endDate) : "";
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(startDate ?? new Date()));

  const todayIso = toISODate(new Date());

  function handleDayClick(day: Date) {
    const iso = toISODate(day);
    if (!startIso || endIso) {
      // Keine oder eine bereits abgeschlossene Auswahl -> neu beginnen.
      onChange(day, null);
      return;
    }
    if (iso < startIso) {
      // Klick vor dem Von-Datum -> als neues Von-Datum behandeln.
      onChange(day, null);
      return;
    }
    onChange(parseISODate(startIso), day);
  }

  const cells = buildMonthGrid(viewMonth);

  return (
    <View
      className={`rounded-brand-md border border-brand-border p-3 dark:border-brand-border-dark ${disabled ? "opacity-50" : ""}`}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <Pressable
          disabled={disabled}
          onPress={() => setViewMonth((m) => addMonths(m, -1))}
          hitSlop={8}
          className="rounded-brand-md px-2 py-1"
        >
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">‹</Text>
        </Pressable>
        <Text className="text-sm font-medium capitalize text-brand-text dark:text-brand-text-dark">
          {monthFormatter.format(viewMonth)}
        </Text>
        <Pressable
          disabled={disabled}
          onPress={() => setViewMonth((m) => addMonths(m, 1))}
          hitSlop={8}
          className="rounded-brand-md px-2 py-1"
        >
          <Text className="text-sm text-brand-text-muted dark:text-brand-text-muted-dark">›</Text>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap">
        {weekdayLabels.map((label) => (
          <View key={label} style={{ width: `${100 / 7}%` }} className="items-center py-1">
            <Text className="text-xs text-brand-text-muted dark:text-brand-text-muted-dark">
              {label}
            </Text>
          </View>
        ))}
        {cells.map((day, index) => {
          if (!day) return <View key={index} style={{ width: `${100 / 7}%` }} />;
          const iso = toISODate(day);
          const isPast = iso < todayIso;
          const isStart = iso === startIso;
          const isEnd = iso === endIso;
          const inRange = !!startIso && !!endIso && iso > startIso && iso < endIso;
          const isDisabled = disabled || isPast;

          return (
            <View key={index} style={{ width: `${100 / 7}%` }} className="p-0.5">
              <Pressable
                disabled={isDisabled}
                onPress={() => handleDayClick(day)}
                className={`items-center rounded-brand-md py-1.5 ${
                  isStart || isEnd
                    ? "bg-brand-accent"
                    : inRange
                      ? "bg-brand-accent/15"
                      : ""
                }`}
              >
                <Text
                  className={`text-sm ${
                    isDisabled
                      ? "text-brand-text-muted/40 dark:text-brand-text-muted-dark/40"
                      : isStart || isEnd
                        ? "font-semibold text-white"
                        : "text-brand-text dark:text-brand-text-dark"
                  }`}
                >
                  {day.getUTCDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
