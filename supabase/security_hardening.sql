-- ============================================================================
-- Security hardening — P0/P1 fixes. Run in the Supabase SQL Editor.
-- Prereq: driver_role_rls.sql already ran (defines fd_caller_role()).
-- ============================================================================

-- ── C3: remove the self-service org_members UPDATE policy ───────────────────
-- `member_activate_self` allowed a collaborator to UPDATE their own row with a
-- WITH CHECK constraining only the email — so a member could set role='admin'
-- and self-escalate. Activation is done server-side (join-org, service role),
-- so the policy is not needed. Drop it.
drop policy if exists "member_activate_self" on public.org_members;

-- ── C1 + C2: lock down the "invoices" storage bucket ────────────────────────
-- The bucket held driver PII (permis, casier, medical) + receipts and was
-- public with bucket-wide insert/delete for any authenticated user. Make it
-- private and scope every operation to the caller's own org folder (the first
-- path segment is the org id: "<orgId>/driver-docs/…" or "<orgId>/receipts/…").

-- Caller's org id (collaborator → org_members.org_id, owner → their uid).
create or replace function public.fd_caller_org()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.org_members
  where user_id = auth.uid() and status = 'active' limit 1
$$;
revoke all on function public.fd_caller_org() from public;
grant execute on function public.fd_caller_org() to authenticated;

update storage.buckets set public = false where id = 'invoices';

-- Drop the previous over-permissive policies (any of the earlier names).
drop policy if exists "invoices_auth_insert"    on storage.objects;
drop policy if exists "invoices_public_select"  on storage.objects;
drop policy if exists "invoices_auth_select"    on storage.objects;
drop policy if exists "invoices_auth_delete"    on storage.objects;

-- Org-scoped access. The first folder must equal the caller's org.
drop policy if exists "invoices_org_select" on storage.objects;
create policy "invoices_org_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'invoices'
    and (storage.foldername(name))[1] = coalesce(public.fd_caller_org()::text, auth.uid()::text));

drop policy if exists "invoices_org_insert" on storage.objects;
create policy "invoices_org_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invoices'
    and (storage.foldername(name))[1] = coalesce(public.fd_caller_org()::text, auth.uid()::text));

drop policy if exists "invoices_org_update" on storage.objects;
create policy "invoices_org_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'invoices'
    and (storage.foldername(name))[1] = coalesce(public.fd_caller_org()::text, auth.uid()::text))
  with check (bucket_id = 'invoices'
    and (storage.foldername(name))[1] = coalesce(public.fd_caller_org()::text, auth.uid()::text));

drop policy if exists "invoices_org_delete" on storage.objects;
create policy "invoices_org_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'invoices'
    and (storage.foldername(name))[1] = coalesce(public.fd_caller_org()::text, auth.uid()::text));

-- IMPORTANT: if you created any OTHER policy on the invoices bucket from the
-- Storage dashboard (e.g. "Enable read access for all"), delete it — a leftover
-- permissive policy would re-open cross-org access via OR.

-- ── H2: drivers must not read other people's PII ────────────────────────────
-- SELECT was org-wide for everyone; restrict drivers to their own records.
drop policy if exists "fd_driver_doc_read" on public.driver_documents;
create policy "fd_driver_doc_read" on public.driver_documents as restrictive
  for select to authenticated
  using (
    public.fd_caller_role() is distinct from 'driver'
    or driver_id in (select id from public.drivers where member_user_id = auth.uid())
  );

drop policy if exists "fd_driver_read_own" on public.drivers;
create policy "fd_driver_read_own" on public.drivers as restrictive
  for select to authenticated
  using (
    public.fd_caller_role() is distinct from 'driver'
    or member_user_id = auth.uid()
  );
