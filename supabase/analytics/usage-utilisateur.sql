-- ============================================================
-- Comment un utilisateur se sert de FleetDesk
-- À exécuter dans Supabase → SQL Editor (lecture seule).
-- Remplacer l'email dans le bloc `cible` de chaque requête.
--
-- RGPD : ces requêtes servent à exploiter et améliorer le service (intérêt
-- légitime du responsable de traitement). Rester sur des agrégats quand c'est
-- possible, ne pas exporter de données personnelles hors de Supabase.
-- ============================================================


-- ─── 1. Le profil du compte ─────────────────────────────────
-- Plan réel (app_metadata, écrit côté serveur), secteur déclaré, état d'onboarding.
with cible as (select id from auth.users where email = 'REMPLACER@exemple.fr')
select
  u.created_at                                    as inscrit_le,
  u.last_sign_in_at                               as derniere_connexion,
  date_trunc('day', now() - u.created_at)         as anciennete,
  u.raw_app_meta_data ->> 'plan'                  as plan,
  u.raw_app_meta_data ->> 'billing_status'        as facturation,
  u.raw_app_meta_data ->> 'trial_end'             as fin_essai,
  u.raw_user_meta_data ->> 'activity'             as secteur_declare,
  u.raw_user_meta_data ->> 'org_company'          as societe,
  coalesce((u.raw_user_meta_data ->> 'onboarding_complete')::boolean, false) as onboarding_termine
from auth.users u
join cible c on c.id = u.id;


-- ─── 2. Adoption : qu'est-ce qui a été réellement utilisé ───
-- Une ligne par module. Un module à 0 = une fonctionnalité jamais découverte.
-- Chaque table est datée par la colonne que l'app utilise réellement pour trier
-- (created_at, date, assigned_at…), castée en timestamptz pour l'union.
with cible as (select id from auth.users where email = 'REMPLACER@exemple.fr')
select 'véhicules' as module, count(*) as volume,
       min(created_at)::timestamptz as premiere, max(created_at)::timestamptz as derniere
  from vehicles where user_id = (select id from cible)
union all select 'conducteurs',         count(*), min(created_at)::timestamptz,     max(created_at)::timestamptz     from drivers               where user_id = (select id from cible)
union all select 'affectations',        count(*), min(assigned_at)::timestamptz,    max(assigned_at)::timestamptz    from assignments           where user_id = (select id from cible)
union all select 'relevés km',          count(*), min(created_at)::timestamptz,     max(created_at)::timestamptz     from mileage_entries       where user_id = (select id from cible)
union all select 'contrôles tech.',     count(*), min(inspection_date)::timestamptz,max(inspection_date)::timestamptz from technical_inspections where user_id = (select id from cible)
union all select 'maintenances',        count(*), min(date)::timestamptz,           max(date)::timestamptz           from maintenance_records   where user_id = (select id from cible)
union all select 'échéanciers entret.', count(*), min(created_at)::timestamptz,     max(created_at)::timestamptz     from maintenance_schedules where user_id = (select id from cible)
union all select 'lavages',             count(*), min(date)::timestamptz,           max(date)::timestamptz           from wash_records          where user_id = (select id from cible)
union all select 'docs conducteur',     count(*), min(created_at)::timestamptz,     max(created_at)::timestamptz     from driver_documents      where org_id  = (select id from cible)
union all select 'collaborateurs',      count(*), min(invited_at)::timestamptz,     max(coalesce(joined_at, invited_at))::timestamptz from org_members where org_id = (select id from cible)
order by volume desc;


-- ─── 3. Le parcours d'activation ────────────────────────────
-- Combien de temps entre l'inscription et chaque premier geste ? Les trous
-- montrent où l'utilisateur a calé.
with cible as (select id, created_at from auth.users where email = 'REMPLACER@exemple.fr')
select
  etape,
  premiere_fois,
  case when premiere_fois is null then null
       else justify_interval(premiere_fois - (select created_at from cible)) end as delai_depuis_inscription
from (
  select 'premier véhicule' as etape,
         (select min(created_at)::timestamptz from vehicles where user_id = (select id from cible)) as premiere_fois
  union all select 'premier conducteur',   (select min(created_at)::timestamptz     from drivers               where user_id = (select id from cible))
  union all select 'première affectation', (select min(assigned_at)::timestamptz    from assignments           where user_id = (select id from cible))
  union all select 'premier relevé km',    (select min(created_at)::timestamptz     from mileage_entries       where user_id = (select id from cible))
  union all select 'premier contrôle',     (select min(inspection_date)::timestamptz from technical_inspections where user_id = (select id from cible))
  union all select 'première invitation',  (select min(invited_at)::timestamptz     from org_members           where org_id  = (select id from cible))
) t
order by premiere_fois nulls last;


-- ─── 4. Le fil d'activité ───────────────────────────────────
-- Ce que la personne a fait, dans l'ordre. `activity_log` est alimenté par
-- l'app à chaque création/suppression.
with cible as (select id from auth.users where email = 'REMPLACER@exemple.fr')
select created_at, user_name, action, entity_type, entity_label
from activity_log
where org_id = (select id from cible)
order by created_at desc
limit 100;


-- ─── 5. Rythme d'usage : jours actifs ───────────────────────
-- Un usage concentré sur un seul jour = découverte. Étalé = adoption.
with cible as (select id from auth.users where email = 'REMPLACER@exemple.fr')
select date_trunc('day', created_at)::date as jour,
       count(*)                            as actions,
       count(distinct action)              as types_d_action
from activity_log
where org_id = (select id from cible)
group by 1
order by 1 desc;


-- ─── 6. Vue cohorte : tous les comptes d'un coup ────────────
-- Plus utile qu'un seul utilisateur quand la base est petite : on voit d'un
-- coup qui a activé et qui a décroché. Aucune donnée nominative affichée.
select
  substring(md5(u.id::text), 1, 6)                as compte,
  u.created_at::date                              as inscrit_le,
  u.last_sign_in_at::date                         as vu_le,
  u.raw_app_meta_data ->> 'plan'                  as plan,
  u.raw_user_meta_data ->> 'activity'             as secteur,
  (select count(*) from vehicles         v where v.user_id = u.id) as vehicules,
  (select count(*) from drivers          d where d.user_id = u.id) as conducteurs,
  (select count(*) from mileage_entries  m where m.user_id = u.id) as releves_km,
  (select count(*) from activity_log     a where a.org_id = u.id)  as actions,
  (select max(a.created_at)::date from activity_log a where a.org_id = u.id) as derniere_action
from auth.users u
where u.raw_user_meta_data ->> 'org_id' is null   -- propriétaires seulement
order by u.created_at desc;
