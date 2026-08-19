-- ============================================================================
-- Mileage entries: a second photo. Chauffeurs must attach a photo of the
-- odometer AND a photo of the fuel ticket / gauge. receipt_url holds the fuel
-- ticket; odometer_url holds the odometer photo. Run in the Supabase SQL Editor.
-- ============================================================================
alter table public.mileage_entries
  add column if not exists odometer_url text;
