import type {
  BookingAdminApprovalStatus,
  BookingFacilityApprovalStatus,
  BookingType,
  PaymentMethod,
  PaymentStatus,
  UnitBookingStatus,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  CancelBookingInput,
  ConfirmKostenuebernahmeUploadInput,
  CreateBookingInput,
  paymentMethodsRequiringStripe,
  RequestKostenuebernahmeUploadInput,
} from "@woodaa/validators";
import { z } from "zod";
import { cancelBooking, createBooking } from "../availability";
import { encryptSecret } from "../crypto";
import {
  resolveBookingRecipient,
  sendAdminPendingBookingApprovalEmail,
  sendBookingConfirmationEmail,
  sendOperatorNewBookingEmail,
} from "../email";
import { chargeAmountCents } from "../pricing";
import { createPresignedDownloadUrl, createPresignedUploadUrl, newDocumentKey } from "../r2";
import { stripeClient } from "../stripe";
import { protectedProcedure, publicProcedure, router } from "../trpc";

// The exact shape returned by myBookings' `select` below - explicit rather
// than a full `Booking &`, since (unlike e.g. AdminPendingBookingApproval)
// this is a deliberate subset of Booking's columns, not all of them.
export type MyBooking = {
  id: string;
  bookingType: BookingType;
  status: UnitBookingStatus;
  startDate: Date | null;
  endDate: Date | null;
  desiredStartDate: Date | null;
  hoursPerDay: number | null;
  guestFirstName: string | null;
  guestLastName: string | null;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  facilityApprovedAt: Date | null;
  adminApprovalStatus: BookingAdminApprovalStatus;
  facilityApprovalStatus: BookingFacilityApprovalStatus;
  createdAt: Date;
  cancelledAt: Date | null;
  facility: { name: string; slug: string; street: string; postalCode: string; city: string };
};

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
      select: {
        id: true,
        name: true,
        slug: true,
        bookingApprovalMode: true,
        capacities: {
          where: { bookingType: input.bookingType },
          select: { pflegegradPricing: true },
        },
        // Für die Betreiber-Benachrichtigung unten - operator ist nullish
        // für Einrichtungen ohne verknüpften Login-Account (z. B. von woodaa
        // im Namen eines Heims angelegt), die Mail entfällt dann einfach.
        operator: { select: { name: true, email: true } },
      },
    });
    if (!facility) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Einrichtung nicht gefunden." });
    }

    const user = await ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });

    const usesStripe = paymentMethodsRequiringStripe.includes(input.paymentMethod);
    const initialPaymentStatus = usesStripe
      ? ("AUSSTEHEND" as const)
      : input.paymentMethod === "RECHNUNG"
        ? ("WARTET_AUF_HEIM_FREIGABE" as const)
        : ("AUSSTEHEND" as const); // KOSTENUEBERNAHME_KASSE: erst nach Beleg-Upload

    const rate = facility.capacities[0]?.pflegegradPricing.find(
      (r) => r.pflegegrad === input.pflegegrad,
    );

    // Fail before reserving a slot - a booking whose payment can never
    // succeed shouldn't block the unit for anyone else.
    let amountCents: number | null = null;
    if (usesStripe) {
      amountCents = chargeAmountCents(
        input.bookingType,
        rate,
        input.startDate ? new Date(input.startDate) : null,
        input.endDate ? new Date(input.endDate) : null,
        input.hoursPerDay ?? null,
      );
      if (amountCents === null) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Für diesen Pflegegrad hat die Einrichtung noch keinen Preis hinterlegt.",
        });
      }
    }

    const booking = await createBooking(ctx.db, {
      facilityId: input.facilityId,
      bookingType: input.bookingType,
      source: "ONLINE",
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      desiredStartDate: input.desiredStartDate ? new Date(input.desiredStartDate) : null,
      hoursPerDay: input.hoursPerDay ?? null,
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
      paymentMethod: input.paymentMethod,
      paymentStatus: initialPaymentStatus,
      // Bevollmächtigte/r Angehörige/r: every booking from such an account
      // needs woodaa staff's sign-off, independent of the facility-side
      // payment approval above - see admin.pendingBookingApprovals.
      adminApprovalStatus: user.vollmachtDocumentKey ? "AUSSTEHEND" : "NICHT_ERFORDERLICH",
      facilityApprovalStatus:
        facility.bookingApprovalMode === "MANUELL" ? "AUSSTEHEND" : "NICHT_ERFORDERLICH",
    });

    const { to, recipientName } = resolveBookingRecipient(user);
    await sendBookingConfirmationEmail({
      to,
      recipientName,
      guestName: `${input.guestFirstName} ${input.guestLastName}`.trim(),
      facilityName: facility.name,
      facilitySlug: facility.slug,
      bookingType: input.bookingType,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      facilityApprovalRequired: facility.bookingApprovalMode === "MANUELL",
    });

    // Betreiber-Benachrichtigung: nur wenn tatsächlich etwas von ihm/ihr
    // gebraucht wird, entweder die manuelle Buchungsbestätigung oder die
    // Zahlungsfreigabe bei RECHNUNG/KOSTENUEBERNAHME_KASSE (siehe
    // Booking.paymentMethod/paymentStatus oben).
    const facilityApprovalRequired = facility.bookingApprovalMode === "MANUELL";
    const paymentApprovalRequired =
      input.paymentMethod === "RECHNUNG" || input.paymentMethod === "KOSTENUEBERNAHME_KASSE";
    if ((facilityApprovalRequired || paymentApprovalRequired) && facility.operator) {
      await sendOperatorNewBookingEmail({
        to: facility.operator.email,
        operatorName: facility.operator.name,
        guestName: `${input.guestFirstName} ${input.guestLastName}`.trim(),
        facilityName: facility.name,
        bookingType: input.bookingType,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        facilityApprovalRequired,
        paymentApprovalRequired,
      });
    }

    // Bevollmächtigte/r Angehörige/r: woodaa-Mitarbeitende müssen die
    // Buchung ebenfalls freigeben, siehe adminApprovalStatus oben und
    // admin.pendingBookingApprovals.
    if (user.vollmachtDocumentKey) {
      await sendAdminPendingBookingApprovalEmail({
        guestName: `${input.guestFirstName} ${input.guestLastName}`.trim(),
        facilityName: facility.name,
        bookingType: input.bookingType,
      });
    }

    if (!usesStripe || amountCents === null) {
      return { booking, stripeClientSecret: null };
    }

    const stripeMethodTypes: Record<"KARTE" | "KLARNA" | "PAYPAL", string[]> = {
      KARTE: ["card"],
      KLARNA: ["klarna"],
      PAYPAL: ["paypal"],
    };
    const paymentIntent = await stripeClient().paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      payment_method_types: stripeMethodTypes[input.paymentMethod as "KARTE" | "KLARNA" | "PAYPAL"],
      metadata: { bookingId: booking.id },
      receipt_email: user.email,
    });

    const updated = await ctx.db.booking.update({
      where: { id: booking.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return { booking: updated, stripeClientSecret: paymentIntent.client_secret };
  }),

  // Kostenübernahmebestätigung hochladen (nur KOSTENUEBERNAHME_KASSE) - Zwei-
  // Schritt-Flow wie operator.requestPhotoUpload/confirmPhotoUpload, hier
  // aber ownership-geprüft gegen den einloggten Buchenden statt gegen eine
  // Einrichtung.
  requestKostenuebernahmeUpload: protectedProcedure
    .input(RequestKostenuebernahmeUploadInput)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({ where: { id: input.bookingId } });
      if (!booking || booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buchung nicht gefunden." });
      }
      if (booking.paymentMethod !== "KOSTENUEBERNAHME_KASSE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Diese Buchung erwartet keine Kostenübernahmebestätigung.",
        });
      }
      const key = newDocumentKey(booking.id, "pdf");
      const uploadUrl = await createPresignedUploadUrl(key, "application/pdf");
      return { uploadUrl, key };
    }),

  confirmKostenuebernahmeUpload: protectedProcedure
    .input(ConfirmKostenuebernahmeUploadInput)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({ where: { id: input.bookingId } });
      if (!booking || booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buchung nicht gefunden." });
      }
      return ctx.db.booking.update({
        where: { id: booking.id },
        data: {
          kostenuebernahmeDocumentKey: input.key,
          paymentStatus: "WARTET_AUF_HEIM_FREIGABE",
        },
      });
    }),

  // Presigned GET, frisch pro Aufruf - siehe Kommentar an
  // kostenuebernahmeDocumentKey in schema.prisma zum Grund (Sozialdaten,
  // keine dauerhaft gültige URL).
  kostenuebernahmeDownloadUrl: protectedProcedure
    .input(RequestKostenuebernahmeUploadInput)
    .query(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({ where: { id: input.bookingId } });
      if (!booking || booking.userId !== ctx.user.id || !booking.kostenuebernahmeDocumentKey) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return { url: await createPresignedDownloadUrl(booking.kostenuebernahmeDocumentKey) };
    }),

  // Für "Meine Buchungen" im Konto - nur die eigenen Buchungen, neueste
  // zuerst. Kein decrypt der Versicherungsnummer, die wird hier nicht
  // gebraucht.
  myBookings: protectedProcedure.query(({ ctx }): Promise<MyBooking[]> =>
    ctx.db.booking.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bookingType: true,
        status: true,
        startDate: true,
        endDate: true,
        desiredStartDate: true,
        hoursPerDay: true,
        guestFirstName: true,
        guestLastName: true,
        paymentMethod: true,
        paymentStatus: true,
        facilityApprovedAt: true,
        adminApprovalStatus: true,
        facilityApprovalStatus: true,
        createdAt: true,
        cancelledAt: true,
        facility: {
          select: { name: true, slug: true, street: true, postalCode: true, city: true },
        },
      },
    }),
  ),

  // Storno durch die eingeloggte Nutzerin/den eingeloggten Nutzer selbst,
  // aus "Meine Buchungen" heraus - Berechtigung ist die Konto-Ownership
  // (userId), nicht die guestEmail wie bei der öffentlichen `cancel`
  // Prozedur unten (die z. B. auch für Buchungen ohne aktuelle Session
  // funktionieren muss, etwa über einen Link in der Bestätigungsmail).
  myCancel: protectedProcedure
    .input(z.object({ bookingId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const booking = await cancelBooking(ctx.db, input.bookingId, {
        requireUserId: ctx.user.id,
      });
      if (booking.paymentStatus === "BEZAHLT" && booking.stripePaymentIntentId) {
        await stripeClient().refunds.create({ payment_intent: booking.stripePaymentIntentId });
      }
      return booking;
    }),

  // Storno durch die Suchende/den Suchenden selbst - keine Login-Pflicht,
  // Nachweis ist die beim Buchen hinterlegte E-Mail-Adresse.
  cancel: publicProcedure.input(CancelBookingInput).mutation(async ({ ctx, input }) => {
    if (!input.guestEmail) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "E-Mail-Adresse wird benötigt." });
    }
    const booking = await cancelBooking(ctx.db, input.bookingId, {
      requireGuestEmail: input.guestEmail,
    });
    // Volle Rückerstattung bei jeder Stornierung, unabhängig vom 48h-
    // Hinweistext im Buchungsformular - eine anteilige Stornogebühr bei
    // später Stornierung durchzusetzen bräuchte eine separate Abbuchung,
    // die es in diesem MVP noch nicht gibt (siehe BookingForm.tsx).
    if (booking.paymentStatus === "BEZAHLT" && booking.stripePaymentIntentId) {
      await stripeClient().refunds.create({ payment_intent: booking.stripePaymentIntentId });
    }
    return booking;
  }),
});
