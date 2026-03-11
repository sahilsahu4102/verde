-- Migration to update the reformulations table for the localized Indian plant-based AI prompt

ALTER TABLE reformulations
ADD COLUMN IF NOT EXISTS local_availability NUMERIC;

-- Optional: Since we changed from a 100-point scale to a 10-point scale,
-- we could divide existing taste/texture scores by 10, but for now we just add the new column.
-- We also updated customer_noticeable_difference to differenceNoticeability (Low/Medium/High)
-- but in the DB it is stored in the same customer_noticeable_difference column.
