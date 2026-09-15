-- ============================================================
-- Activation — combien de comptes sont bloqués, et l'email y change-t-il
-- quelque chose. À exécuter dans le SQL Editor (lecture seule).
--
-- Même logique d'éligibilité que supabase/functions/activation-digest :
-- au moins un véhicule, et soit un véhicule sans date de contrôle technique,
-- soit la moitié de la flotte sans intervalle d'entretien.
-- ============================================================


-- ─── 1. Qui est éligible aujourd'hui ────────────────────────
with flotte as (
  select
    u.id                                   as org_id,
    u.email,
    (select count(*) from vehicles v where v.user_id = u.id) as total,
    (select count(*) from vehicles v
       where v.user_id = u.id
         and not exists (
           select 1 from technical_inspections ti
           where ti.vehicle_id = v.id and ti.expiration_date is not null)) as sans_ct,
    (select count(*) from vehicles v
       where v.user_id = u.id
         and not exists (
           select 1 from maintenance_schedules ms
           where ms.vehicle_id = v.id
             and (ms.interval_months is not null or ms.interval_km is not null))) as sans_entretien
  from auth.users u
  where u.raw_user_meta_data ->> 'org_id' is null          -- propriétaires seulement
    and coalesce((u.raw_user_meta_data ->> 'digest_opt_out')::boolean, false) = false
)
select
  substring(md5(org_id::text), 1, 6) as compte,
  total, sans_ct, sans_entretien,
  case when sans_ct > 0 then 'ct'
       when sans_entretien >= ceil(total / 2.0) then 'maintenance'
       else null end as raison
from flotte
where total > 0
  and (sans_ct > 0 or sans_entretien >= ceil(total / 2.0))
order by sans_ct desc, total desc;


-- ─── 2. Le compte en une ligne ──────────────────────────────
-- Combien de comptes sont éligibles, sur combien de comptes non vides.
with flotte as (
  select u.id as org_id,
    (select count(*) from vehicles v where v.user_id = u.id) as total,
    (select count(*) from vehicles v where v.user_id = u.id
       and not exists (select 1 from technical_inspections ti
                       where ti.vehicle_id = v.id and ti.expiration_date is not null)) as sans_ct,
    (select count(*) from vehicles v where v.user_id = u.id
       and not exists (select 1 from maintenance_schedules ms
                       where ms.vehicle_id = v.id
                         and (ms.interval_months is not null or ms.interval_km is not null))) as sans_entretien
  from auth.users u where u.raw_user_meta_data ->> 'org_id' is null
)
select
  count(*) filter (where total = 0)                                    as comptes_vides,
  count(*) filter (where total > 0)                                    as comptes_avec_vehicules,
  count(*) filter (where total > 0 and sans_ct > 0)                    as bloques_sur_le_ct,
  count(*) filter (where total > 0 and sans_ct = 0
                     and sans_entretien >= ceil(total / 2.0))          as bloques_sur_l_entretien,
  count(*) filter (where total > 0 and sans_ct = 0
                     and sans_entretien < ceil(total / 2.0))           as flottes_completes
from flotte;


-- ─── 3. Ce que l'email a produit ────────────────────────────
-- Envois, clics, et comptes ayant complété leurs données depuis.
with envois as (
  select org_id, min(sent_at) as premier_envoi, count(*) as envois,
         (details ->> 'missing_ct')::int as manquants_a_l_envoi
  from digest_log
  where kind = 'activation'
  group by org_id, details ->> 'missing_ct'
),
clics as (
  select org_id, count(*) as clics, min(sent_at) as premier_clic
  from digest_log where kind = 'activation_click' group by org_id
),
etat as (
  select u.id as org_id,
    (select count(*) from vehicles v where v.user_id = u.id
       and not exists (select 1 from technical_inspections ti
                       where ti.vehicle_id = v.id and ti.expiration_date is not null)) as sans_ct_aujourdhui
  from auth.users u
)
select
  substring(md5(e.org_id::text), 1, 6) as compte,
  e.premier_envoi::date, e.envois, coalesce(c.clics, 0) as clics,
  e.manquants_a_l_envoi, s.sans_ct_aujourdhui,
  case when s.sans_ct_aujourdhui = 0 then 'complété'
       when s.sans_ct_aujourdhui < e.manquants_a_l_envoi then 'en cours'
       else 'inchangé' end as suite_donnee
from envois e
left join clics c on c.org_id = e.org_id
join etat s on s.org_id = e.org_id
order by e.premier_envoi desc;


-- ─── 4. Ce qui bloque le plus souvent ───────────────────────
select details ->> 'reason' as raison,
       count(*)             as envois,
       round(avg((details ->> 'missing_ct')::numeric), 1)     as moy_vehicules_sans_ct,
       round(avg((details ->> 'total_vehicles')::numeric), 1) as moy_taille_flotte
from digest_log
where kind = 'activation'
group by 1
order by envois desc;


-- ─── 5. Journal brut des envois (contrôle anti-spam) ────────
select org_id, kind, sent_at, signature, item_count, details
from digest_log
order by sent_at desc
limit 50;
