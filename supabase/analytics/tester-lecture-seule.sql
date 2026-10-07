-- ============================================================================
-- Tester la lecture seule en base, après readonly_rls.sql
-- ----------------------------------------------------------------------------
-- On se fait passer pour un compte, on tente une écriture, et on annule tout :
-- le ROLLBACK final garantit que rien n'est jamais enregistré, même si la
-- règle ne bloque pas.
--
-- Prérequis : le compte de test doit être marqué « inactive ». C'est sync-plan
-- qui l'écrit, à la première connexion qui suit le déploiement — vérifier
-- d'abord avec la requête 1.
-- ============================================================================

-- 1) L'état du compte de test (attendu : inactive, pas offert) ---------------
select email,
       raw_app_meta_data->>'subscription' as abonnement,
       raw_app_meta_data->>'comped'       as offert,
       public.fd_org_writable(id)         as peut_ecrire
from auth.users
where email = 'hiraishin.ongaku@gmail.com';


-- 2) Tentative d'écriture en se faisant passer pour lui ----------------------
-- Attendu : « new row violates row-level security policy for table vehicles ».
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',  (select id from auth.users where email = 'hiraishin.ongaku@gmail.com'),
      'role', 'authenticated'
    )::text,
    true
  );
  set local role authenticated;

  insert into public.vehicles (user_id, plate_number, model)
  values ((select auth.uid()), 'TEST-RLS', 'Essai lecture seule');
rollback;


-- 3) Contre-épreuve avec un compte ouvert (attendu : l'insertion passe, puis
--    le ROLLBACK l'annule). Remplacer l'adresse par un compte payant ou offert.
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',  (select id from auth.users where email = 'demo@fleetdesk.fr'),
      'role', 'authenticated'
    )::text,
    true
  );
  set local role authenticated;

  insert into public.vehicles (user_id, plate_number, model)
  values ((select auth.uid()), 'TEST-RLS', 'Essai compte ouvert')
  returning id, plate_number;
rollback;
