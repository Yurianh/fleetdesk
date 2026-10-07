-- ============================================================================
-- Lecture seule sans abonnement — application en base (RLS)
-- ----------------------------------------------------------------------------
-- L'application ferme déjà l'écriture aux comptes sans abonnement (bandeau,
-- formulaires inertes, refus dans la couche de données). Mais c'est du code
-- client : un appel direct à l'API Supabase, avec le jeton du compte, passait
-- encore. Ces règles ferment la porte en base.
--
-- Principe : des politiques RESTRICTIVES, combinées par ET avec les politiques
-- existantes. Elles ne peuvent que resserrer l'accès — elles n'ont pas besoin
-- de connaître ni de modifier ce qui est déjà en place (même méthode que
-- driver_role_rls.sql).
--
-- La règle porte sur le PROPRIÉTAIRE de la ligne (user_id, ou org_id pour les
-- documents conducteurs), pas sur la personne qui écrit. Un collaborateur
-- d'une organisation sans abonnement est donc fermé lui aussi — c'est
-- l'organisation qui n'a plus d'abonnement, pas la personne.
--
-- Ce qui reste ouvert, volontairement :
--   * la LECTURE : les données restent consultables, c'est toute l'idée ;
--   * la SUPPRESSION : effacer ses données ne donne accès à rien, et un client
--     doit pouvoir retirer les données personnelles d'un conducteur parti, avec
--     ou sans abonnement (RGPD) ;
--   * le rôle service (fonctions Edge, webhook Stripe) : il contourne la RLS.
--
-- Idempotent : peut être relancé sans risque.
-- ============================================================================


-- 1) L'organisation peut-elle écrire ? ---------------------------------------
-- Lit l'état d'abonnement du propriétaire dans auth.users, écrit uniquement
-- par le serveur (sync-plan, webhook Stripe, confirm-payment). SECURITY
-- DEFINER pour pouvoir lire auth.users depuis une politique.
--
-- Ouverte si : compte offert, OU état « active », OU état absent (compte pas
-- encore synchronisé — mieux vaut laisser écrire que verrouiller un client qui
-- paie). Même règle que resolveAccess() côté application.
create or replace function public.fd_org_writable(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (
      select (u.raw_app_meta_data->>'comped') = 'true'
          or coalesce(u.raw_app_meta_data->>'subscription', 'active') <> 'inactive'
      from auth.users u
      where u.id = owner
    ),
    true
  )
$$;

revoke all on function public.fd_org_writable(uuid) from public;
grant execute on function public.fd_org_writable(uuid) to authenticated;


-- 2) Création et modification refusées sans abonnement -----------------------
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('vehicles',              'user_id'),
      ('drivers',               'user_id'),
      ('assignments',           'user_id'),
      ('mileage_entries',       'user_id'),
      ('maintenance_records',   'user_id'),
      ('maintenance_schedules', 'user_id'),
      ('technical_inspections', 'user_id'),
      ('wash_records',          'user_id'),
      ('driver_documents',      'org_id')
    ) as x(tbl, owner_col)
  loop
    execute format('drop policy if exists "fd_readonly_insert" on public.%I', t.tbl);
    execute format(
      'create policy "fd_readonly_insert" on public.%I as restrictive for insert to authenticated
         with check (public.fd_org_writable(%I))',
      t.tbl, t.owner_col);

    execute format('drop policy if exists "fd_readonly_update" on public.%I', t.tbl);
    execute format(
      'create policy "fd_readonly_update" on public.%I as restrictive for update to authenticated
         using (public.fd_org_writable(%I))
         with check (public.fd_org_writable(%I))',
      t.tbl, t.owner_col, t.owner_col);
  end loop;
end $$;


-- 3) Justificatifs : pas de dépôt de fichier sans abonnement -----------------
-- Les fichiers du bucket « invoices » sont rangés sous <id de l'organisation>/.
-- La politique est restrictive sur storage.objects, donc elle s'applique à
-- tous les buckets : elle laisse passer tout ce qui n'est pas « invoices »,
-- et tout dossier qui n'a pas la forme d'un identifiant.
--
-- CASE plutôt que OR : Postgres ne garantit pas l'ordre d'évaluation d'un OR,
-- et la conversion en uuid d'un dossier qui n'en est pas un ferait échouer le
-- dépôt au lieu de le laisser passer. Les branches d'un CASE, elles, sont
-- évaluées dans l'ordre.
drop policy if exists "fd_readonly_invoices_insert" on storage.objects;
create policy "fd_readonly_invoices_insert" on storage.objects as restrictive
  for insert to authenticated
  with check (
    case
      when bucket_id <> 'invoices' then true
      when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then public.fd_org_writable(((storage.foldername(name))[1])::uuid)
      else true
    end
  );

drop policy if exists "fd_readonly_invoices_update" on storage.objects;
create policy "fd_readonly_invoices_update" on storage.objects as restrictive
  for update to authenticated
  using (
    case
      when bucket_id <> 'invoices' then true
      when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then public.fd_org_writable(((storage.foldername(name))[1])::uuid)
      else true
    end
  );


-- 4) Vérification -----------------------------------------------------------
-- Les politiques posées :
select tablename, policyname, cmd, permissive
from pg_policies
where policyname like 'fd_readonly_%'
order by tablename, cmd;
