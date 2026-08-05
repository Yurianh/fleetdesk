-- ============================================================================
-- Mileage entries: remember which conducteur (driver) the entry was logged for,
-- so the list can show the driver + their carte DKV, accurate historically even
-- if the vehicle is reassigned later. Run in the Supabase SQL Editor.
-- ============================================================================
alter table public.mileage_entries
  add column if not exists driver_id uuid;
