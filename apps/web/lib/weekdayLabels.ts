// ISO weekday numbering (1 = Montag ... 7 = Sonntag), matching the
// Tages-/Nachtpflege search filter and the operator.setShift weekday
// input - see Weekday in packages/validators.
export const weekdayLabels: Record<number, string> = {
  1: "Montag",
  2: "Dienstag",
  3: "Mittwoch",
  4: "Donnerstag",
  5: "Freitag",
  6: "Samstag",
  7: "Sonntag",
};

export const weekdayShortLabels: Record<number, string> = {
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa",
  7: "So",
};

// A literal tuple (not `Object.keys(weekdayLabels).map(...)`) so `value`
// keeps the 1|2|...|7 type operator.setShift's Weekday input expects,
// instead of widening to `number` - and so `label` stays a plain `string`
// rather than the `string | undefined` that indexing the Record above
// would produce under noUncheckedIndexedAccess.
export const weekdayOptions: { value: 1 | 2 | 3 | 4 | 5 | 6 | 7; label: string }[] = [
  { value: 1, label: "Montag" },
  { value: 2, label: "Dienstag" },
  { value: 3, label: "Mittwoch" },
  { value: 4, label: "Donnerstag" },
  { value: 5, label: "Freitag" },
  { value: 6, label: "Samstag" },
  { value: 7, label: "Sonntag" },
];
