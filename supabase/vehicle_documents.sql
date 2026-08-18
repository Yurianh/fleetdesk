-- ============================================================================
-- Vehicles: store the insurance certificate + transport license alongside the
-- registration document (carte grise). Run in the Supabase SQL Editor.
-- ============================================================================
alter table public.vehicles
  add column if not exists insurance_url         text,
  add column if not exists transport_license_url text;
