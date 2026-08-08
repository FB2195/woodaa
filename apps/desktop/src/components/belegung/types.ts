import type { RouterOutputs } from "../../lib/trpc";

export type FacilityData = NonNullable<RouterOutputs["operator"]["myFacility"]>;
export type UnitWithBookings = FacilityData["units"][number];
export type CapacityData = FacilityData["capacities"][number];
export type WaitlistEntryData = RouterOutputs["operator"]["waitlistEntries"][number];
