-- Facilities can now use the availability tool (PENDING_REVIEW) without
-- writing a public-listing description first - only required to go public
-- (ACTIVE). Existing rows already have a non-empty description, so this is
-- purely additive: just drops the NOT NULL requirement and adds a default
-- for new rows.
ALTER TABLE "Facility" ALTER COLUMN "description" SET DEFAULT '';
