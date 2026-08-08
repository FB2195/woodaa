// Kept in sync with apps/web/components/account/MyBookingsSection.tsx.
export const paymentStatusLabels: Record<string, string> = {
  AUSSTEHEND: "Zahlung ausstehend",
  BEZAHLT: "Bezahlt",
  WARTET_AUF_HEIM_FREIGABE: "Wartet auf Freigabe der Einrichtung",
  FREIGEGEBEN: "Freigegeben",
  ABGELEHNT: "Zahlung abgelehnt",
  REFUNDIERT: "Erstattet",
};

export const facilityApprovalLabels: Record<
  string,
  { text: string; tone: "amber" | "accent" | "red" }
> = {
  AUSSTEHEND: { text: "Bestätigung durch die Einrichtung ausstehend", tone: "amber" },
  BESTAETIGT: { text: "Von der Einrichtung bestätigt", tone: "accent" },
  ABGELEHNT: { text: "Von der Einrichtung abgelehnt", tone: "red" },
};
