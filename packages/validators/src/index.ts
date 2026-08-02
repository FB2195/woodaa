import { z } from "zod";

/**
 * Shared enums/schemas used by web, mobile and the backend so the three
 * booking types and user roles stay in sync everywhere without duplication.
 */

export const BookingType = z.enum([
  "STATIONAERE_AUFNAHME", // langfristige Dauerpflege
  "KURZZEITPFLEGE", // zeitlich befristeter Aufenthalt
  "TAGES_NACHTPFLEGE", // teilstationäre Betreuung ohne durchgängige Übernachtung
]);
export type BookingType = z.infer<typeof BookingType>;

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

export const FacilitySearchInput = z.object({
  city: z.string().trim().min(1).optional(),
  bookingType: BookingType.optional(),
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

export const WeekdaySlots = z.object({
  mon: z.number().int().min(0),
  tue: z.number().int().min(0),
  wed: z.number().int().min(0),
  thu: z.number().int().min(0),
  fri: z.number().int().min(0),
  sat: z.number().int().min(0),
  sun: z.number().int().min(0),
});
export type WeekdaySlots = z.infer<typeof WeekdaySlots>;

export const CreateFacilityInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  street: z.string().trim().min(1).max(200),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(200),
  state: z.string().trim().min(1).max(200),
  amenities: z.array(z.string().trim().min(1).max(100)).max(30),
  operatorPhone: z.string().trim().max(50).optional(),
});
export type CreateFacilityInput = z.infer<typeof CreateFacilityInput>;

export const UpdateFacilityInput = CreateFacilityInput.partial();
export type UpdateFacilityInput = z.infer<typeof UpdateFacilityInput>;

export const UpdateCapacityInput = z.object({
  bookingType: BookingType,
  totalSlots: z.number().int().min(0),
  availableSlots: z.number().int().min(0),
  availableFrom: z.string().datetime().optional(),
  weekdaySlots: WeekdaySlots.optional(),
});
export type UpdateCapacityInput = z.infer<typeof UpdateCapacityInput>;

export const KurzzeitpflegeRangeInput = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});
export type KurzzeitpflegeRangeInput = z.infer<
  typeof KurzzeitpflegeRangeInput
>;
