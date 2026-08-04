import { TRPCError } from "@trpc/server";
import { CancelBookingInput, CreateBookingInput } from "@woodaa/validators";
import { cancelBooking, createBooking } from "../availability";
import { encryptSecret } from "../crypto";
import { protectedProcedure, publicProcedure, router } from "../trpc";

// Verbindliche, sofort bestätigte Buchung ("wie Booking.com") - im
// Unterschied zu bookingRequest.create (unverbindliche Anfrage) wird hier
// direkt ein Platz atomar beansprucht, siehe availability.createBooking.
// Erfordert Login (anders als früher): eine verbindliche Buchung mit echten
// Sozialdaten (Versicherungsnummer, Pflegegrad) ohne Konto zuzulassen wäre
// weder nachvollziehbar noch für den Suchenden später auffindbar.
export const bookingRouter = router({
  create: protectedProcedure.input(CreateBookingInput).mutation(async ({ ctx, input }) => {
    const facility = await ctx.db.facility.findUnique({
      where: { id: input.facilityId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!facility) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
    }

    const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });

    return createBooking(ctx.db, {
      facilityId: input.facilityId,
      bookingType: input.bookingType,
      source: "ONLINE",
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      desiredStartDate: input.desiredStartDate ? new Date(input.desiredStartDate) : null,
      userId: user.id,
      guestName: `${input.guestFirstName} ${input.guestLastName}`.trim(),
      guestEmail: user.email,
      guestPhone: input.guestPhone,
      guestFirstName: input.guestFirstName,
      guestLastName: input.guestLastName,
      guestBirthDate: new Date(input.guestBirthDate),
      guestStreet: input.guestStreet,
      guestPostalCode: input.guestPostalCode,
      guestCity: input.guestCity,
      krankenkasse: input.krankenkasse,
      versicherungsnummerEncrypted: encryptSecret(input.versicherungsnummer),
      pflegegrad: input.pflegegrad,
      pflegegradAntragLaeuft: input.pflegegradAntragLaeuft ?? false,
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
