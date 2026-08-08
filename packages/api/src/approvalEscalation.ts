import type { PrismaClient } from "@prisma/client";
import { sendOperatorApprovalReminderEmail } from "./email";

// How long a MANUELL-Freigabe booking may sit at facilityApprovalStatus=
// AUSSTEHEND before nudging the operator, and - if it's still unanswered
// after that - getting flagged for woodaa staff to step in manually (see
// admin.escalatedPendingApprovals). Nothing here changes the booking
// itself; a human still has to confirm/reject it (operator.confirmBooking/
// rejectBooking) or an admin has to intervene.
const REMINDER_AFTER_HOURS = 48;
const ESCALATION_AFTER_HOURS = 96;

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// Run periodically from apps/api (see scheduleApprovalEscalation in
// index.ts) - the only long-lived process in this stack, Vercel/apps/web
// can't run background intervals. Reminder and escalation are independent
// checks (both keyed off createdAt, not off each other) so a booking still
// gets escalated even if this job didn't run in time to send the 48h
// reminder first.
export async function escalateStalePendingApprovals(db: PrismaClient): Promise<void> {
  const dueForReminder = await db.booking.findMany({
    where: {
      facilityApprovalStatus: "AUSSTEHEND",
      approvalReminderSentAt: null,
      createdAt: { lte: hoursAgo(REMINDER_AFTER_HOURS) },
    },
    include: { facility: { include: { operator: true } } },
  });

  for (const booking of dueForReminder) {
    // operator is the Betreiber's login account (User), distinct from the
    // facility's public operatorEmail contact field - same recipient the
    // original sendOperatorNewBookingEmail went to (see booking.create).
    if (booking.facility.operator) {
      await sendOperatorApprovalReminderEmail({
        to: booking.facility.operator.email,
        operatorName: booking.facility.operator.name,
        guestName: `${booking.guestFirstName ?? ""} ${booking.guestLastName ?? ""}`.trim(),
        facilityName: booking.facility.name,
        bookingType: booking.bookingType,
      });
    }
    await db.booking.update({
      where: { id: booking.id },
      data: { approvalReminderSentAt: new Date() },
    });
  }

  // No email here - this just flags the booking for staff visibility (see
  // admin.escalatedPendingApprovals), matching the "no in-app retry, staff
  // handle manually" pattern already used for refundFailedAt.
  await db.booking.updateMany({
    where: {
      facilityApprovalStatus: "AUSSTEHEND",
      approvalEscalatedAt: null,
      createdAt: { lte: hoursAgo(ESCALATION_AFTER_HOURS) },
    },
    data: { approvalEscalatedAt: new Date() },
  });
}
