-- ============================================================================
-- Let admins (not just the owner) manage the team.
-- ----------------------------------------------------------------------------
-- Server enforcement lives in the invite-member / remove-member edge functions
-- (service role). This file only adds the RLS SELECT policy an admin needs to
-- *read* the members list in the app; owner/member policies are untouched.
--
-- Prerequisite: driver_role_rls.sql already ran (it defines fd_caller_role()).
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- Caller's org id, read from org_members with a SECURITY DEFINER function so the
-- policy below does not recurse on org_members' own RLS.
create or replace function public.fd_caller_org()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
  from public.org_members
  where user_id = auth.uid() and status = 'active'
  limit 1
$$;

revoke all on function public.fd_caller_org() from public;
grant execute on function public.fd_caller_org() to authenticated;

-- An active admin may read every member row of their own org (needed to list,
-- then remove, teammates). fd_caller_role() is SECURITY DEFINER → no recursion.
drop policy if exists "admin_see_org_members" on public.org_members;
create policy "admin_see_org_members" on public.org_members
  for select
  using (
    public.fd_caller_role() = 'admin'
    and org_id = public.fd_caller_org()
  );
