// Mirrors the "covers this date" rule in packages/api/src/availability.ts's
// occupiedUnitIds - kept in sync by hand since one lives in the availability
// engine (Prisma query) and this one runs client/server-side over an
// already-fetched booking list. A null startDate means STATIONAERE_AUFNAHME
// (occupied indefinitely from creation), matching that function exactly.
function coversToday(
  startDate: Date | string | null,
  endDate: Date | string | null,
  today: Date,
): boolean {
  if (!startDate) return true;
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  if (start > today) return false;
  if (!endDate) return true;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  return end >= today;
}

export type UnitStatus = "FREI" | "BELEGT" | "ANFRAGE" | "RESERVIERT";

type StatusInput = {
  startDate: Date | string | null;
  endDate: Date | string | null;
  facilityApprovalStatus: string;
};

// One booking (of possibly several historical ones on the same unit) covers
// "today" at most, thanks to the DB-level exclusion constraint - see the
// Booking model comment in schema.prisma. ANFRAGE (still needs your
// approve/reject decision) takes priority over plain BELEGT since it's the
// state that needs your attention, even though the unit is technically
// occupied either way.
export function computeUnitStatus<B extends StatusInput>(
  bookings: B[],
): { status: UnitStatus; booking: B | null } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = bookings.find((b) => coversToday(b.startDate, b.endDate, today));
  if (current) {
    return {
      status: current.facilityApprovalStatus === "AUSSTEHEND" ? "ANFRAGE" : "BELEGT",
      booking: current,
    };
  }

  const upcoming = bookings
    .filter((b): b is B & { startDate: Date | string } => {
      if (!b.startDate) return false;
      const start = typeof b.startDate === "string" ? new Date(b.startDate) : b.startDate;
      return start > today;
    })
    .sort((a, b) => {
      const aStart = typeof a.startDate === "string" ? new Date(a.startDate) : a.startDate;
      const bStart = typeof b.startDate === "string" ? new Date(b.startDate) : b.startDate;
      return aStart.getTime() - bStart.getTime();
    })[0];

  if (upcoming) return { status: "RESERVIERT", booking: upcoming };
  return { status: "FREI", booking: null };
}
