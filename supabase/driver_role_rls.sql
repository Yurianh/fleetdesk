-- ============================================================================
-- Driver (chauffeur / sous-membre) server-side enforcement — RLS
-- ----------------------------------------------------------------------------
-- The app UI already restricts drivers, but that is not security. This adds
-- RESTRICTIVE policies so a driver cannot bypass the UI and call the API to
-- write other data. Restrictive policies are AND-ed with your existing
-- permissive policies, so they only *tighten* access — they do not need to
-- know or modify what you already have.
--
-- Trust model: the driver's role and vehicle come from `org_members` (written
-- only by the service role in the invite-member function), NOT from
-- user_metadata, which the user can edit via auth.updateUser().
--
-- Prerequisites:
--   * RLS is already enabled on the tables below (it is — the app scopes by
--     user_id). These statements only ADD restrictive policies.
--   * Redeploy the invite-member function so it writes org_members.vehicle_id.
--
-- Review before running on production, then test with a real driver account.
-- ============================================================================

-- 0) Allow the 'driver' role in the org_members role CHECK constraint ----------
-- The original constraint only permits admin/member; widen it for chauffeurs.
alter table public.org_members drop constraint if exists org_members_role_check;
alter table public.org_members
  add constraint org_members_role_check check (role in ('admin', 'member', 'driver', 'sub-member'));

-- 1) Store the driver's vehicle on the trusted org_members row -----------------
alter table public.org_members
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;

-- Link a driver's account to their conducteur (drivers) record + a pending flag
-- so a chauffeur can complete their own profile on first login.
alter table public.drivers
  add column if not exists member_user_id uuid,
  add column if not exists pending boolean not null default false;

-- 2) Trusted lookups (security definer bypasses RLS to read org_members) -------
create or replace function public.fd_caller_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.org_members
  where user_id = auth.uid() and status = 'active'
  limit 1
$$;

create or replace function public.fd_caller_vehicle()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select vehicle_id
  from public.org_members
  where user_id = auth.uid() and status = 'active'
  limit 1
$$;

revoke all on function public.fd_caller_role() from public;
revoke all on function public.fd_caller_vehicle() from public;
grant execute on function public.fd_caller_role() to authenticated;
grant execute on function public.fd_caller_vehicle() to authenticated;

-- Note on the predicate: `fd_caller_role() is distinct from 'driver'` is TRUE
-- for owners (no org_members row → NULL), admins and members, so their access
-- is unchanged. It is FALSE only for drivers, who then fall to the vehicle check.

-- 3) mileage_entries + wash_records: drivers only for their own vehicle --------
do $$
declare t text;
begin
  foreach t in array array['mileage_entries','wash_records']
  loop
    execute format('drop policy if exists fd_driver_insert on public.%I', t);
    execute format(
      'create policy fd_driver_insert on public.%I as restrictive for insert to authenticated
         with check (public.fd_caller_role() is distinct from ''driver'' or vehicle_id = public.fd_caller_vehicle())', t);

    execute format('drop policy if exists fd_driver_update on public.%I', t);
    execute format(
      'create policy fd_driver_update on public.%I as restrictive for update to authenticated
         using (public.fd_caller_role() is distinct from ''driver'' or vehicle_id = public.fd_caller_vehicle())
         with check (public.fd_caller_role() is distinct from ''driver'' or vehicle_id = public.fd_caller_vehicle())', t);

    -- Drivers may not delete records
    execute format('drop policy if exists fd_driver_delete on public.%I', t);
    execute format(
      'create policy fd_driver_delete on public.%I as restrictive for delete to authenticated
         using (public.fd_caller_role() is distinct from ''driver'')', t);
  end loop;
end $$;

-- 3b) drivers: no insert/delete for drivers, but they MAY update their OWN
--     linked conducteur record (member_user_id = auth.uid()) to complete it.
drop policy if exists fd_driver_no_insert on public.drivers;
create policy fd_driver_no_insert on public.drivers as restrictive for insert to authenticated
  with check (public.fd_caller_role() is distinct from 'driver');
drop policy if exists fd_driver_own_update on public.drivers;
create policy fd_driver_own_update on public.drivers as restrictive for update to authenticated
  using (public.fd_caller_role() is distinct from 'driver' or member_user_id = auth.uid())
  with check (public.fd_caller_role() is distinct from 'driver' or member_user_id = auth.uid());
drop policy if exists fd_driver_no_delete on public.drivers;
create policy fd_driver_no_delete on public.drivers as restrictive for delete to authenticated
  using (public.fd_caller_role() is distinct from 'driver');

-- 4) Everything else: drivers get NO write access -----------------------------
-- SELECT is left untouched so the driver can still see their vehicle's name and
-- their own mileage/wash lists (read is scoped by your existing org policies).
-- (drivers handled above; org_members not looped so join-org service role is unaffected.)
do $$
declare t text;
begin
  foreach t in array array[
    'vehicles','assignments','maintenance_records',
    'maintenance_schedules','technical_inspections','driver_documents','org_members'
  ]
  loop
    execute format('drop policy if exists fd_driver_no_insert on public.%I', t);
    execute format(
      'create policy fd_driver_no_insert on public.%I as restrictive for insert to authenticated
         with check (public.fd_caller_role() is distinct from ''driver'')', t);

    execute format('drop policy if exists fd_driver_no_update on public.%I', t);
    execute format(
      'create policy fd_driver_no_update on public.%I as restrictive for update to authenticated
         using (public.fd_caller_role() is distinct from ''driver'')', t);

    execute format('drop policy if exists fd_driver_no_delete on public.%I', t);
    execute format(
      'create policy fd_driver_no_delete on public.%I as restrictive for delete to authenticated
         using (public.fd_caller_role() is distinct from ''driver'')', t);
  end loop;
end $$;

-- ============================================================================
-- Verify (run as a driver, e.g. via the SQL editor impersonation or the app):
--   select public.fd_caller_role();      -- should return 'driver'
--   select public.fd_caller_vehicle();   -- should return their vehicle uuid
--   insert into vehicles (...) ...;       -- must FAIL for a driver
--   insert into mileage_entries (vehicle_id, ...) values (<other vehicle>, ...); -- FAIL
--   insert into mileage_entries (vehicle_id, ...) values (<their vehicle>, ...);  -- OK
-- ============================================================================

-- ============================================================================
-- Realtime: ensure the admin's Conducteurs list updates live when a chauffeur
-- edits their own profile. Add the table to the supabase_realtime publication
-- if it isn't already there (idempotent).
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'drivers'
  ) then
    alter publication supabase_realtime add table public.drivers;
  end if;
end $$;
