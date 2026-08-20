-- ============================================================================
-- Restrict a chauffeur's READ access to their own assigned vehicle, for the
-- data they can enter (mileage + washes). Previously SELECT was org-wide, so a
-- driver could see every vehicle's entries. RESTRICTIVE policies AND with the
-- existing org policies, so admins/members/owner are unaffected.
--
-- Prerequisite: driver_role_rls.sql already ran (defines fd_caller_role/vehicle).
-- Run in the Supabase SQL Editor.
-- ============================================================================

drop policy if exists "fd_driver_read_mileage" on public.mileage_entries;
create policy "fd_driver_read_mileage" on public.mileage_entries as restrictive
  for select to authenticated
  using (
    public.fd_caller_role() is distinct from 'driver'
    or vehicle_id = public.fd_caller_vehicle()
  );

drop policy if exists "fd_driver_read_wash" on public.wash_records;
create policy "fd_driver_read_wash" on public.wash_records as restrictive
  for select to authenticated
  using (
    public.fd_caller_role() is distinct from 'driver'
    or vehicle_id = public.fd_caller_vehicle()
  );
