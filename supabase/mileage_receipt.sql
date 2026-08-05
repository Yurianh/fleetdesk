-- ============================================================================
-- Mileage entries: attach a fuel invoice (receipt) + a free-text label.
-- Drivers ("chauffeurs") log mileage at the pump, so they can now attach a
-- photo/PDF of the receipt and a short label. Run in the Supabase SQL Editor.
-- ============================================================================

-- 1) Columns on mileage_entries -----------------------------------------------
alter table public.mileage_entries
  add column if not exists receipt_url text,
  add column if not exists label       text;

-- 2) Storage: make sure any authenticated user (including chauffeurs) can upload
--    a receipt into the shared "invoices" bucket, and that receipts are readable.
--    The bucket is already public for reads; these policies are additive and
--    idempotent (existing driver-document policies are left untouched).
insert into storage.buckets (id, name, public)
  values ('invoices', 'invoices', true)
  on conflict (id) do update set public = true;

drop policy if exists "invoices_auth_insert" on storage.objects;
create policy "invoices_auth_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invoices');

drop policy if exists "invoices_public_select" on storage.objects;
create policy "invoices_public_select" on storage.objects
  for select
  using (bucket_id = 'invoices');

drop policy if exists "invoices_auth_delete" on storage.objects;
create policy "invoices_auth_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'invoices');
