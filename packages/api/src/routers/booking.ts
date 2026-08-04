import { TRPCError } from "@trpc/server";
import { CancelBookingInput, CreateBookingInput } from "@woodaa/validators";
import { cancelBooking, createBooking } from "../availability";
import { publicProcedure, router } from "../trpc";

// Öffentliche, sofort verbindliche Buchung ("wie Booking.com") - im
// Unterschied zu bookingRequest.create (unverbindliche Anfrage) wird hier
// direkt ein Platz atomar beansprucht, siehe availability.createBooking.
export const bookingRouter = router({
  create: publicProcedure.input(CreateBookingInput).mutation(async ({ ctx, input }) => {
    const facility = await ctx.db.facility.findUnique({
      where: { id: input.facilityId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!facility) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
    }
    if (!input.guestEmail) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "E-Mail-Adresse wird für die Online-Buchung benötigt.",
      });
    }

    return createBooking(ctx.db, {
      facilityId: input.facilityId,
      bookingType: input.bookingType,
      source: "ONLINE",
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      note: input.note,
    });
  }),

  // Storno durch die Suchende/den Suchenden selbst - keine Login-Pflicht,
  // Nachweis ist die beim Buchen hinterlegte E-Mail-Adresse (gleiches
  // Vertrauensmodell wie bei Review.reviewerEmail).
  cancel: publicProcedure.input(CancelBookingInput).mutation(async ({ ctx, input }) => {
    if (!input.guestEmail) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "E-Mail-Adresse wird benötigt." });
    }
    return cancelBooking(ctx.db, input.bookingId, { requireGuestEmail: input.guestEmail });
  }),
});
