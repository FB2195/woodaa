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
  "ONLINE", // sofort verbindliche Buchung über Woodaa
  "TELEFON",
  "VOR_ORT",
]);
export type UnitBookingSource = z.infer<typeof UnitBookingSource>;

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

export const SortOption = z.enum(["newest", "price_asc", "distance_asc"]);
export type SortOption = z.infer<typeof SortOption>;

export const FacilitySearchInput = z.object({
  city: z.string().trim().min(1).optional(),
  bookingType: BookingType.optional(),
  maxPriceCents: z.coerce.number().int().min(0).optional(),
  radiusKm: z.coerce.number().int().positive().max(200).optional(),
  pflegegrad: Pflegegrad.optional(),
  sort: SortOption.optional(),
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
export type CreateBookingRequestInput = z.infer<
  typeof CreateBookingRequestInput
>;

export const RegisterInput = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["SUCHENDE", "BETREIBER"]),
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
  minPflegegrad: Pflegegrad.optional(),
  maxPflegegrad: Pflegegrad.optional(),
});

// .partial() must run before .refine() - ZodEffects (what .refine() returns)
// has no .partial(), so UpdateFacilityInput derives from the plain object,
// not from CreateFacilityInput.
const pflegegradRangeOk = (data: {
  minPflegegrad?: number;
  maxPflegegrad?: number;
}) =>
  data.minPflegegrad == null ||
  data.maxPflegegrad == null ||
  data.minPflegegrad <= data.maxPflegegrad;

export const CreateFacilityInput = FacilityFields.refine(pflegegradRangeOk, {
  message: "Pflegegrad von darf nicht größer als Pflegegrad bis sein.",
  path: ["maxPflegegrad"],
});
export type CreateFacilityInput = z.infer<typeof CreateFacilityInput>;

export const UpdateFacilityInput = FacilityFields.partial().refine(
  pflegegradRangeOk,
  {
    message: "Pflegegrad von darf nicht größer als Pflegegrad bis sein.",
    path: ["maxPflegegrad"],
  },
);
export type UpdateFacilityInput = z.infer<typeof UpdateFacilityInput>;

// totalSlots/availableSlots are no longer operator-editable input - they're
// a maintained cache derived from FacilityUnit/Booking (see
// packages/api/src/availability.ts). Pricing metadata is still direct
// operator input, set via updatePricing.
export const UpdatePricingInput = z.object({
  bookingType: BookingType,
  monthlyPriceCents: z.number().int().min(0).optional(),
  availableFrom: z.string().datetime().optional(),
});
export type UpdatePricingInput = z.infer<typeof UpdatePricingInput>;

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

// Shared by the public instant-booking flow (source always "ONLINE", no
// operator auth) and the operator's manual booking page (TELEFON/VOR_ORT).
// startDate/endDate: required together for KURZZEITPFLEGE/TAGESPFLEGE/
// NACHTPFLEGE (for Tages-/Nachtpflege, start === end, a single day), absent
// for STATIONAERE_AUFNAHME (unbefristet).
export const CreateBookingInput = z
  .object({
    facilityId: z.string().min(1),
    bookingType: BookingType,
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

export const AllowedPhotoContentType = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export type AllowedPhotoContentType = z.infer<typeof AllowedPhotoContentType>;

// Shared by operator.ts (server-side cap enforcement) and PhotoManager.tsx
// (UI: disabling the upload button, pre-flight size check).
export const MAX_FACILITY_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

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
  reviewerEmail: z.string().trim().email(),
  rating: Rating,
  careRating: Rating.optional(),
  cleanlinessRating: Rating.optional(),
  foodRating: Rating.optional(),
  staffRating: Rating.optional(),
  comment: z.string().trim().max(2000).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInput>;
