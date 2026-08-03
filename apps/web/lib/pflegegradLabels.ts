import type { Pflegegrad } from "@woodaa/validators";

export const pflegegradLabels: Record<Pflegegrad, string> = {
  0: "Noch keine Einstufung",
  1: "Pflegegrad 1",
  2: "Pflegegrad 2",
  3: "Pflegegrad 3",
  4: "Pflegegrad 4",
  5: "Pflegegrad 5",
};

export const pflegegradOptions = (
  Object.keys(pflegegradLabels).map(Number) as Pflegegrad[]
).map((value) => ({ value, label: pflegegradLabels[value] }));
