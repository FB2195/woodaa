import { z } from "zod";

/**
 * Shared enums/schemas used by web, mobile and the backend so the three
 * booking types and user roles stay in sync everywhere without duplication.
 */

export const BookingType = z.enum([
  "STATIONAERE_AUFNAHME", // langfristige Dauerpflege, unbefristet belegt
  "KURZZEITPFLEGE", // zeitlich befristeter Aufenthalt (Start-/Enddatum)
  "TAGESPFLEGE", // teilstationär tagsüber, tageweise buchbar
  "NACHTPFLEGE", // teilstationär nachts, tageweise buchbar
]);
export type BookingType = z.infer<typeof BookingType>;

export const UnitBookingSource = z.enum([
  "ONLINE", // sofort verbindliche Buchung über woodaa
  "TELEFON",
  "VOR_ORT",
]);
export type UnitBookingSource = z.infer<typeof UnitBookingSource>;

export const PaymentMethod = z.enum([
  "KARTE",
  "KLARNA",
  "PAYPAL",
  "RECHNUNG", // wird über das Heim abgewickelt, braucht dessen Freigabe
  "KOSTENUEBERNAHME_KASSE", // Kasse zahlt das Heim direkt, braucht Beleg + Freigabe
]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

// RECHNUNG/KOSTENUEBERNAHME_KASSE brauchen keine Stripe-Zahlung, laufen also
// nicht über booking.create's Stripe-Zweig - siehe routers/booking.ts.
export const paymentMethodsRequiringStripe: PaymentMethod[] = ["KARTE", "KLARNA", "PAYPAL"];

export const Role = z.enum([
  "SUCHENDE", // Angehörige / Pflegebedürftige, die einen Platz suchen
  "BETREIBER", // Pflegeheim-Betreiber
  "ADMIN",
]);
export type Role = z.infer<typeof Role>;

export const Pflegegrad = z.union([
  z.literal(0), // noch keine Einstufung
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type Pflegegrad = z.infer<typeof Pflegegrad>;

// The Krankenversicherungsnummer (KVNR) printed on the front of every
// gesetzliche Gesundheitskarte: one letter followed by 9 digits (e.g.
// A123456789) - not to be confused with the unrelated Sozialversicherungs-
// nummer (Rentenversicherung). Only meaningful for GKV members; private
// insurers issue their own, differently-formatted policy numbers (see
// RegisterSuchendeInput, which only enforces this pattern when
// krankenkasseArt is GESETZLICH). Used unconditionally elsewhere
// (booking/care profile) where the insurance type isn't tracked, so it
// stays a loose length check there rather than this exact pattern.
export const GESETZLICHE_VERSICHERUNGSNUMMER_REGEX = /^[A-Za-z][0-9]{9}$/;
export const GESETZLICHE_VERSICHERUNGSNUMMER_MESSAGE =
  "Das sieht nicht nach einer gültigen Versichertennummer aus - sie besteht aus einem Buchstaben gefolgt von 9 Ziffern (z. B. A123456789) und steht auf der Vorderseite deiner Versichertenkarte.";

export const Versicherungsnummer = z.string().trim().min(1).max(50);
export type Versicherungsnummer = z.infer<typeof Versicherungsnummer>;

export const SortOption = z.enum(["newest", "price_asc", "distance_asc", "availability_first"]);
export type SortOption = z.infer<typeof SortOption>;

// ISO weekday numbering (1 = Montag ... 7 = Sonntag) - used for the
// Tages-/Nachtpflege "welche Wochentage" search filter.
export const Weekday = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);
export type Weekday = z.infer<typeof Weekday>;

// Curated list of common Pflegeheim-Zusatzleistungen - shown as checkboxes
// when operators set up their Ausstattung (see apps/web AmenitiesEditor.tsx)
// and as filter chips in the search results toolbar (see SearchResultsView).
// Facility.amenities itself stays a plain string array in the DB, so an
// operator can still add something not on this list via "Eigene Angabe".
export const AMENITY_OPTIONS = [
  "Einzelzimmer",
  "Doppelzimmer",
  "Blick ins Grüne",
  "Balkon/Terrasse im Zimmer",
  "TV im Zimmer",
  "Telefon im Zimmer",
  "WLAN im Zimmer",
  "Barrierefreiheit",
  "Garten",
  "Cafeteria",
  "Friseursalon",
  "Fußpflege",
  "Bibliothek",
  "Haustiere erlaubt",
  "Seelsorge/religiöse Angebote",
  "Ergotherapie",
  "Physiotherapie",
  "Demenzbetreuung",
  "Palliativpflege",
  "Eigene Küche/Vollverpflegung",
  "Wäscheservice",
  "Notrufsystem",
] as const;

export const FacilitySearchInput = z.object({
  city: z.string().trim().min(1).optional(),
  bookingType: BookingType.optional(),
  maxPriceCents: z.coerce.number().int().min(0).optional(),
  radiusKm: z.coerce.number().int().positive().max(200).optional(),
  pflegegrad: Pflegegrad.optional(),
  sort: SortOption.optional(),
  amenities: z.array(z.string()).optional(),
  // Availability filters - only meaningful once bookingType narrows to one
  // category (see facility.list in packages/api), each field pairs with a
  // specific bookingType:
  // STATIONAERE_AUFNAHME - earliest acceptable move-in date.
  availableFromDate: z.coerce.date().optional(),
  // KURZZEITPFLEGE - the desired stay's date range.
  rangeStart: z.coerce.date().optional(),
  rangeEnd: z.coerce.date().optional(),
  // TAGESPFLEGE/NACHTPFLEGE - which weekdays and how many hours/day.
  weekdays: z.array(Weekday).optional(),
  hoursPerDay: z.coerce.number().int().positive().max(24).optional(),
  // Default true (today's existing behavior: a bookingType filter already
  // only shows facilities with free capacity) - set false to also surface
  // fully-booked facilities, flagged instead of hidden.
  onlyAvailable: z.coerce.boolean().optional(),
});
export type FacilitySearchInput = z.infer<typeof FacilitySearchInput>;

export const CreateBookingRequestInput = z.object({
  facilityId: z.string().min(1),
  bookingType: BookingType,
  requesterName: z.string().trim().min(1).max(200),
  requesterEmail: z.string().trim().email(),
  requesterPhone: z.string().trim().max(50).optional(),
  pflegegrad: Pflegegrad.optional(),
  message: z.string().trim().max(2000).optional(),
  desiredStart: z.string().datetime().optional(),
  desiredEnd: z.string().datetime().optional(),
});
export type CreateBookingRequestInput = z.infer<typeof CreateBookingRequestInput>;

// Same public/no-login shape as CreateBookingRequestInput above - see
// WaitlistEntry in schema.prisma. No desiredStart/desiredEnd: joining a
// waitlist is about "let me know when *any* spot opens", not a specific
// date range.
export const CreateWaitlistEntryInput = z.object({
  facilityId: z.string().min(1),
  bookingType: BookingType,
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50).optional(),
  pflegegrad: Pflegegrad.optional(),
  message: z.string().trim().max(2000).optional(),
});
export type CreateWaitlistEntryInput = z.infer<typeof CreateWaitlistEntryInput>;

// A registering SUCHENDE is the account holder themselves (or someone
// registering on their own behalf) - name/address/Pflegegrad/Krankenkasse
// collected once here so BookingForm can prefill instead of asking fresh
// every booking. bevollmaechtigter* fields are an optional reference
// contact (see the comment on User.hatBevollmaechtigten in schema.prisma) -
// NOT the same as the separate, woodaa-reviewed Vollmacht-document flow for
// accounts that book on behalf of someone else.
const bevollmaechtigterFieldsOk = (data: {
  hatBevollmaechtigten: boolean;
  bevollmaechtigterVorname?: string;
  bevollmaechtigterNachname?: string;
  bevollmaechtigterAdresse?: string;
  bevollmaechtigterTelefon?: string;
  bevollmaechtigterEmail?: string;
}) =>
  !data.hatBevollmaechtigten ||
  Boolean(
    data.bevollmaechtigterVorname &&
    data.bevollmaechtigterNachname &&
    data.bevollmaechtigterAdresse &&
    data.bevollmaechtigterTelefon &&
    data.bevollmaechtigterEmail,
  );

// Plain object (no .refine()) so it stays usable as a discriminatedUnion
// member below - the bevollmaechtigterFieldsOk check runs as a
// .superRefine() on the union instead (ZodEffects, which .refine() would
// produce, isn't a valid discriminatedUnion member).
export const RegisterSuchendeInput = z.object({
  role: z.literal("SUCHENDE"),
  vorname: z.string().trim().min(1).max(100),
  nachname: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  geburtsdatum: z.string().date(),
  street: z.string().trim().min(1).max(200),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(200),
  // The one optional field - everything else about the account holder is
  // required at registration (see RegisterSuchendeForm).
  phone: z.string().trim().max(50).optional(),
  pflegegrad: Pflegegrad,
  pflegegradAntragLaeuft: z.boolean().default(false),
  krankenkasseArt: z.enum(["GESETZLICH", "PRIVAT"]),
  krankenkasse: z.string().trim().min(1).max(200),
  versicherungsnummer: Versicherungsnummer,
  hatBevollmaechtigten: z.boolean().default(false),
  bevollmaechtigterVorname: z.string().trim().max(100).optional(),
  bevollmaechtigterNachname: z.string().trim().max(100).optional(),
  bevollmaechtigterAdresse: z.string().trim().max(300).optional(),
  bevollmaechtigterTelefon: z.string().trim().max(50).optional(),
  bevollmaechtigterEmail: z.string().trim().email().optional(),
  newsletterOptIn: z.boolean().default(false),
  agbAccepted: z.literal(true),
  datenschutzAccepted: z.literal(true),
});
export type RegisterSuchendeInput = z.infer<typeof RegisterSuchendeInput>;

// A registering BETREIBER creates their facility in the same step (rather
// than a separate "create facility" step afterwards) - name doubles as
// both the account's display name and the facility's public
// "Ansprechpartner" (see operatorName in schema.prisma), same as the
// existing createFacility flow already did from user.name.
export const RegisterBetreiberInput = z.object({
  role: z.literal("BETREIBER"),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  facilityName: z.string().trim().min(1).max(200),
  street: z.string().trim().min(1).max(200),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(200),
  state: z.string().trim().min(1).max(200),
  operatorPhone: z.string().trim().min(1).max(50),
  operatorPhoneDurchwahl: z.string().trim().max(50).optional(),
  agbAccepted: z.literal(true),
});
export type RegisterBetreiberInput = z.infer<typeof RegisterBetreiberInput>;

export const RegisterInput = z
  .discriminatedUnion("role", [RegisterSuchendeInput, RegisterBetreiberInput])
  .superRefine((data, ctx) => {
    if (data.role !== "SUCHENDE") return;
    if (!bevollmaechtigterFieldsOk(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bitte alle Angaben zum Bevollmächtigten ausfüllen.",
        path: ["bevollmaechtigterVorname"],
      });
    }
    // Private Krankenversicherungen vergeben eigene, uneinheitliche
    // Mitgliedsnummern - das feste KVNR-Format gilt nur für GKV-Mitglieder.
    if (
      data.krankenkasseArt === "GESETZLICH" &&
      !GESETZLICHE_VERSICHERUNGSNUMMER_REGEX.test(data.versicherungsnummer)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: GESETZLICHE_VERSICHERUNGSNUMMER_MESSAGE,
        path: ["versicherungsnummer"],
      });
    }
  });
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const BootstrapAdminInput = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});
export type BootstrapAdminInput = z.infer<typeof BootstrapAdminInput>;

export const ForgotPasswordInput = z.object({
  email: z.string().trim().email(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInput>;

export const ResetPasswordInput = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordInput>;

export const UpdateNameInput = z.object({
  name: z.string().trim().min(1).max(200),
});
export type UpdateNameInput = z.infer<typeof UpdateNameInput>;

// Two-step email change (old address confirms intent, then new address
// confirms ownership) - see EmailChangeRequest in schema.prisma and
// requestEmailChange/confirmOldEmailChange/confirmNewEmailChange in
// routers/auth.ts.
export const RequestEmailChangeInput = z.object({
  newEmail: z.string().trim().email().max(200),
});
export type RequestEmailChangeInput = z.infer<typeof RequestEmailChangeInput>;

export const ConfirmEmailChangeInput = z.object({
  token: z.string().min(1),
});
export type ConfirmEmailChangeInput = z.infer<typeof ConfirmEmailChangeInput>;

const FacilityFields = z.object({
  name: z.string().trim().min(1).max(200),
  // Empty by default - only required to request public listing (see
  // requestPublicListing in operator.ts), not to create a facility and use
  // the internal availability tool.
  description: z.string().trim().max(5000).default(""),
  street: z.string().trim().min(1).max(200),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(200),
  state: z.string().trim().min(1).max(200),
  amenities: z.array(z.string().trim().min(1).max(100)).max(30),
  operatorPhone: z.string().trim().max(50).optional(),
  operatorPhoneDurchwahl: z.string().trim().max(50).optional(),
  minPflegegrad: Pflegegrad.optional(),
  maxPflegegrad: Pflegegrad.optional(),
});

// .partial() must run before .refine() - ZodEffects (what .refine() returns)
// has no .partial(), so UpdateFacilityInput derives from the plain object,
// not from CreateFacilityInput.
const pflegegradRangeOk = (data: { minPflegegrad?: number; maxPflegegrad?: number }) =>
  data.minPflegegrad == null ||
  data.maxPflegegrad == null ||
  data.minPflegegrad <= data.maxPflegegrad;

export const CreateFacilityInput = FacilityFields.refine(pflegegradRangeOk, {
  message: "Pflegegrad von darf nicht größer als Pflegegrad bis sein.",
  path: ["maxPflegegrad"],
});
export type CreateFacilityInput = z.infer<typeof CreateFacilityInput>;

// Only the non-critical fields - name/street/postalCode/city/state/
// operatorName/operatorEmail/operatorPhone are trust-sensitive public info
// and go through RequestFacilityChangeInput/admin approval instead (see
// requestFacilityChange in operator.ts). These apply immediately.
const UpdatableFacilityFields = FacilityFields.omit({
  name: true,
  street: true,
  postalCode: true,
  city: true,
  state: true,
  operatorPhone: true,
  operatorPhoneDurchwahl: true,
}).extend({
  // Unterkunftsrichtlinien - free text, immediate, no approval needed.
  checkInTime: z.string().trim().max(200).optional(),
  checkOutTime: z.string().trim().max(200).optional(),
  visitingHours: z.string().trim().max(200).optional(),
  wifiInfo: z.string().trim().max(200).optional(),
  parkingInfo: z.string().trim().max(200).optional(),
  petsPolicy: z.string().trim().max(200).optional(),
  // Stornobedingungen - free cancellation up to N days before the booking's
  // start. null = "keine Angabe" (see cancellationPolicyDays in
  // schema.prisma for why this is informational-only).
  cancellationPolicyDays: z.number().int().min(0).max(365).nullable().optional(),
});

export const UpdateFacilityInput = UpdatableFacilityFields.partial().refine(pflegegradRangeOk, {
  message: "Pflegegrad von darf nicht größer als Pflegegrad bis sein.",
  path: ["maxPflegegrad"],
});
export type UpdateFacilityInput = z.infer<typeof UpdateFacilityInput>;

// The critical, trust-sensitive fields - submitting this creates/overwrites
// a pending FacilityChangeRequest instead of touching Facility directly. An
// admin must approve before the new values go live (see
// FacilityChangeRequest in schema.prisma and requestFacilityChange/
// approveFacilityChangeRequest). Every field optional since the operator
// only resubmits what they're actually changing; at least one required.
export const RequestFacilityChangeInput = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    street: z.string().trim().min(1).max(200).optional(),
    postalCode: z.string().trim().min(1).max(20).optional(),
    city: z.string().trim().min(1).max(200).optional(),
    state: z.string().trim().min(1).max(200).optional(),
    operatorName: z.string().trim().min(1).max(200).optional(),
    operatorEmail: z.string().trim().email().max(200).optional(),
    operatorPhone: z.string().trim().max(50).optional(),
    operatorPhoneDurchwahl: z.string().trim().max(50).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Mindestens ein Feld muss geändert werden.",
  });
export type RequestFacilityChangeInput = z.infer<typeof RequestFacilityChangeInput>;

// totalSlots/availableSlots are no longer operator-editable input - they're
// a maintained cache derived from FacilityUnit/Booking (see
// packages/api/src/availability.ts). Pricing metadata is still direct
// operator input, set via updatePricing.
export const UpdatePricingInput = z.object({
  bookingType: BookingType,
  availableFrom: z.string().datetime().optional(),
  // KURZZEITPFLEGE only - omitted (rather than 0/null) clears it, same
  // "whole form resubmits every time" convention as availableFrom above.
  minStayNights: z.number().int().min(1).max(60).optional(),
});
export type UpdatePricingInput = z.infer<typeof UpdatePricingInput>;

// Real per-Pflegegrad rates, the actual basis for every Eigenanteil/
// Zuschuss calculation - see CapacityPflegegradPricing in schema.prisma
// for which fields apply to which bookingType. A field left undefined
// clears that rate (the form always resubmits the whole per-Pflegegrad
// row, so "not sent" means "operator left it blank").
export const PflegegradRateInput = z.object({
  pflegegrad: Pflegegrad,
  dailyRateCents: z.number().int().min(0).optional(),
  monthlyRateCents: z.number().int().min(0).optional(),
  hourlyRateCents: z.number().int().min(0).optional(),
});
export type PflegegradRateInput = z.infer<typeof PflegegradRateInput>;

export const SetPflegegradPricingInput = z.object({
  bookingType: BookingType,
  rates: z.array(PflegegradRateInput).max(6),
});
export type SetPflegegradPricingInput = z.infer<typeof SetPflegegradPricingInput>;

export const SetUnitCountInput = z.object({
  bookingType: BookingType,
  totalUnits: z.number().int().min(0).max(500),
});
export type SetUnitCountInput = z.infer<typeof SetUnitCountInput>;

export const RenameUnitInput = z.object({
  unitId: z.string().min(1),
  label: z.string().trim().min(1).max(100),
});
export type RenameUnitInput = z.infer<typeof RenameUnitInput>;

// The public instant-booking flow - requires login (see booking.ts:
// protectedProcedure), so guestEmail/guestName aren't collected here
// anymore (derived server-side from the authenticated user and
// guestFirstName/guestLastName respectively). startDate/endDate: required
// for KURZZEITPFLEGE/TAGESPFLEGE/NACHTPFLEGE (for Tages-/Nachtpflege,
// start === end for a single day); endDate may be left off for "Ende
// offen" (open-ended, common for ongoing Tages-/Nachtpflege); both absent
// for STATIONAERE_AUFNAHME (unbefristet - use desiredStartDate instead,
// purely informational).
export const CreateBookingInput = z
  .object({
    facilityId: z.string().min(1),
    bookingType: BookingType,
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    desiredStartDate: z.string().datetime().optional(),
    guestFirstName: z.string().trim().min(1).max(200),
    guestLastName: z.string().trim().min(1).max(200),
    guestBirthDate: z.string().datetime(),
    guestStreet: z.string().trim().min(1).max(200),
    guestPostalCode: z.string().trim().min(1).max(20),
    guestCity: z.string().trim().min(1).max(200),
    krankenkasse: z.string().trim().min(1).max(200),
    versicherungsnummer: Versicherungsnummer,
    pflegegrad: Pflegegrad,
    pflegegradAntragLaeuft: z.boolean().optional(),
    guestPhone: z.string().trim().max(50).optional(),
    note: z.string().trim().max(1000).optional(),
    paymentMethod: PaymentMethod,
    // TAGESPFLEGE/NACHTPFLEGE only - siehe Booking.hoursPerDay.
    hoursPerDay: z.number().int().min(1).max(24).optional(),
  })
  .refine((data) => !(data.startDate === undefined && data.endDate !== undefined), {
    message: "Ohne Startdatum kann kein Enddatum gesetzt werden.",
    path: ["endDate"],
  })
  .refine(
    (data) =>
      !(
        (data.bookingType === "TAGESPFLEGE" || data.bookingType === "NACHTPFLEGE") &&
        data.hoursPerDay === undefined
      ),
    {
      message: "Bitte gib die Stunden pro Tag an.",
      path: ["hoursPerDay"],
    },
  );
export type CreateBookingInput = z.infer<typeof CreateBookingInput>;

// Same shape as CreateBookingInput but without facilityId - used by the
// operator's manual booking mutation, where the facility is always implied
// by the authenticated operator, never client-supplied.
export const CreateManualBookingInput = z
  .object({
    bookingType: BookingType,
    source: z.enum(["TELEFON", "VOR_ORT"]),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    guestName: z.string().trim().min(1).max(200),
    guestEmail: z.string().trim().email().optional(),
    guestPhone: z.string().trim().max(50).optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .refine((data) => (data.startDate === undefined) === (data.endDate === undefined), {
    message: "Start- und Enddatum müssen beide gesetzt sein oder beide leer bleiben.",
    path: ["endDate"],
  });
export type CreateManualBookingInput = z.infer<typeof CreateManualBookingInput>;

export const CancelBookingInput = z.object({
  bookingId: z.string().min(1),
  // Nur für die öffentliche Stornierung durch Suchende - muss mit der
  // beim Buchen hinterlegten E-Mail übereinstimmen. Betreiber stornieren
  // ohne dieses Feld (Facility-Ownership reicht als Berechtigung).
  guestEmail: z.string().trim().email().optional(),
});
export type CancelBookingInput = z.infer<typeof CancelBookingInput>;

export const AllowedPhotoContentType = z.enum(["image/jpeg", "image/png", "image/webp"]);
export type AllowedPhotoContentType = z.infer<typeof AllowedPhotoContentType>;

// Shared by operator.ts (server-side cap enforcement) and PhotoManager.tsx
// (UI: disabling the upload button, pre-flight size check).
export const MAX_FACILITY_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

// Kostenübernahmebestätigung/Vollmacht PDF uploads (booking.ts,
// careApplication.ts) - same presigned-PUT-then-confirm flow and the same
// server-side headUploadedObjectSize enforcement as facility photos above,
// just a looser cap since a scanned multi-page document is larger than a
// single photo.
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export const RequestPhotoUploadInput = z.object({
  contentType: AllowedPhotoContentType,
});
export type RequestPhotoUploadInput = z.infer<typeof RequestPhotoUploadInput>;

export const ConfirmPhotoUploadInput = z.object({
  key: z.string().min(1).max(500),
});
export type ConfirmPhotoUploadInput = z.infer<typeof ConfirmPhotoUploadInput>;

export const Rating = z.number().int().min(1).max(5);
export type Rating = z.infer<typeof Rating>;

export const CreateReviewInput = z.object({
  facilityId: z.string().min(1),
  reviewerName: z.string().trim().min(1).max(200),
  rating: Rating,
  careRating: Rating.optional(),
  cleanlinessRating: Rating.optional(),
  foodRating: Rating.optional(),
  staffRating: Rating.optional(),
  comment: z.string().trim().max(2000).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInput>;

export const ReplyToReviewInput = z.object({
  reviewId: z.string().min(1),
  reply: z.string().trim().min(1).max(2000),
});
export type ReplyToReviewInput = z.infer<typeof ReplyToReviewInput>;

export const SupportRequestType = z.enum(["KONTAKT", "RUECKRUF", "FEHLERMELDUNG"]);
export type SupportRequestType = z.infer<typeof SupportRequestType>;

export const CreateSupportRequestInput = z.object({
  type: SupportRequestType,
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50).optional(),
  message: z.string().trim().min(1).max(4000),
  pageUrl: z.string().trim().max(500).optional(),
});
export type CreateSupportRequestInput = z.infer<typeof CreateSupportRequestInput>;

export const ChatMessageInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});
export type ChatMessageInput = z.infer<typeof ChatMessageInput>;

// A real Sozialversicherungsnummer, not just a display string - loosely
export const UpdateCareProfileInput = z.object({
  versicherungsnummer: Versicherungsnummer.optional(),
  pflegegrad: Pflegegrad.optional(),
  pflegegradAntragLaeuft: z.boolean().optional(),
  krankenkasse: z.string().trim().min(1).max(200).optional(),
  // Bevollmächtigte/r Angehörige/r only - the person this account books
  // care for, distinct from the account holder's own name.
  careRecipientName: z.string().trim().min(1).max(200).optional(),
});
export type UpdateCareProfileInput = z.infer<typeof UpdateCareProfileInput>;

// Vollmacht PDF upload - same request/confirm two-step as facility photos
// (RequestPhotoUploadInput above) and the Kostenübernahme document
// (RequestKostenuebernahmeUploadInput below), just scoped to the logged-in
// user directly rather than a specific booking. Uploading one is what
// makes an account "bevollmächtigt" - see User.vollmachtDocumentKey.
export const ConfirmVollmachtUploadInput = z.object({
  key: z.string().min(1).max(500),
});
export type ConfirmVollmachtUploadInput = z.infer<typeof ConfirmVollmachtUploadInput>;

// Client-settable states only - EINGEREICHT_UEBER_WOODAA is set by the
// server itself once submitCareApplication actually sends the PDF.
export const SettableCareApplicationStatus = z.enum(["BEREITS_BEANTRAGT", "MUSS_BEANTRAGT_WERDEN"]);
export type SettableCareApplicationStatus = z.infer<typeof SettableCareApplicationStatus>;

export const SetCareApplicationStatusInput = z.object({
  bookingType: BookingType,
  status: SettableCareApplicationStatus,
});
export type SetCareApplicationStatusInput = z.infer<typeof SetCareApplicationStatusInput>;

export const SubmitCareApplicationInput = z.object({
  bookingType: BookingType,
  // Typed full name as the signature, plus an explicit confirmation - see
  // PublicListingPrompt-style pattern elsewhere for why this stays a
  // simple typed-name confirmation rather than a drawn signature pad.
  signatureName: z.string().trim().min(2).max(200),
  confirmed: z.literal(true),
});
export type SubmitCareApplicationInput = z.infer<typeof SubmitCareApplicationInput>;

// Kostenübernahmebestätigung upload (KOSTENUEBERNAHME_KASSE bookings only) -
// same request/confirm two-step as facility photos (see RequestPhotoUploadInput
// above), just PDF-only and scoped to one specific booking.
export const RequestKostenuebernahmeUploadInput = z.object({
  bookingId: z.string().min(1),
});
export type RequestKostenuebernahmeUploadInput = z.infer<typeof RequestKostenuebernahmeUploadInput>;

export const ConfirmKostenuebernahmeUploadInput = z.object({
  bookingId: z.string().min(1),
  key: z.string().min(1).max(500),
});
export type ConfirmKostenuebernahmeUploadInput = z.infer<typeof ConfirmKostenuebernahmeUploadInput>;

// RECHNUNG/KOSTENUEBERNAHME_KASSE bookings sit in WARTET_AUF_HEIM_FREIGABE
// until the facility approves or rejects them on their dashboard.
export const BookingPaymentApprovalInput = z.object({
  bookingId: z.string().min(1),
});
export type BookingPaymentApprovalInput = z.infer<typeof BookingPaymentApprovalInput>;
