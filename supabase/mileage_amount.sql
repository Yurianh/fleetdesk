-- Fuel amount on mileage entries. Optional monetary value captured at the pump,
-- so fuel spend feeds the consolidated expenses export alongside maintenance
-- and washes. No backfill: existing rows keep NULL (no amount recorded).
alter table public.mileage_entries
  add column if not exists amount numeric;
