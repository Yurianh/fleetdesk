-- ============================================================================
-- Let a chauffeur be assigned up to two vehicles and choose between them.
-- org_members.vehicle_ids holds the set; fd_caller_vehicles() returns it; the
-- driver RLS policies now match ANY of the caller's vehicles.
-- Prerequisite: driver_role_rls.sql already ran. Run in the SQL Editor.
-- ============================================================================

-- 1) Store the set of vehicles (keep vehicle_id for backward compatibility).
alter table public.org_members
  add column if not exists vehicle_ids uuid[];

update public.org_members
  set vehicle_ids = array[vehicle_id]
  where vehicle_id is not null and (vehicle_ids is null or cardinality(vehicle_ids) = 0);

-- 2) Trusted lookup: the caller's assigned vehicles (array).
create or replace function public.fd_caller_vehicles()
returns uuid[] language sql stable security definer set search_path = public as $$
  select coalesce(vehicle_ids, case when vehicle_id is not null then array[vehicle_id] end)
  from public.org_members
  where user_id = auth.uid() and status = 'active'
  limit 1
$$;
revoke all on function public.fd_caller_vehicles() from public;
grant execute on function public.fd_caller_vehicles() to authenticated;

-- 3) Rewrite the driver policies to match ANY assigned vehicle.
do $$
declare t text;
begin
  foreach t in array array['mileage_entries','wash_records']
  loop
    execute format('drop policy if exists fd_driver_insert on public.%I', t);
    execute format(
      'create policy fd_driver_insert on public.%I as restrictive for insert to authenticated
         with check (public.fd_caller_role() is distinct from ''driver'' or vehicle_id = ANY(public.fd_caller_vehicles()))', t);

    execute format('drop policy if exists fd_driver_update on public.%I', t);
    execute format(
      'create policy fd_driver_update on public.%I as restrictive for update to authenticated
         using (public.fd_caller_role() is distinct from ''driver'' or vehicle_id = ANY(public.fd_caller_vehicles()))
         with check (public.fd_caller_role() is distinct from ''driver'' or vehicle_id = ANY(public.fd_caller_vehicles()))', t);
  end loop;
end $$;

-- Read scope: a driver reads mileage / wash only for their assigned vehicles.
drop policy if exists "fd_driver_read_mileage" on public.mileage_entries;
create policy "fd_driver_read_mileage" on public.mileage_entries as restrictive
  for select to authenticated
  using (public.fd_caller_role() is distinct from 'driver'
    or vehicle_id = ANY(public.fd_caller_vehicles()));

drop policy if exists "fd_driver_read_wash" on public.wash_records;
create policy "fd_driver_read_wash" on public.wash_records as restrictive
  for select to authenticated
  using (public.fd_caller_role() is distinct from 'driver'
    or vehicle_id = ANY(public.fd_caller_vehicles()));
