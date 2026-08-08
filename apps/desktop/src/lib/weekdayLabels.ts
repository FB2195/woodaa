import type { Weekday } from "@woodaa/validators";

// ISO weekday numbering (1 = Montag ... 7 = Sonntag), same convention used
// for the Tages-/Nachtpflege search filter on the website.
export const weekdayShortLabels: Record<Weekday, string> = {
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa",
  7: "So",
};

export const weekdayOrder: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
