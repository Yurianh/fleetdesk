-- ============================================================
-- Vérifier l'activité d'un compte suspect
-- À exécuter dans le SQL Editor de Supabase. Lecture seule : aucune requête
-- ne modifie quoi que ce soit.
--
-- Usage : remplacer l'identifiant ci-dessous, puis exécuter les blocs un par
-- un (chaque bloc est une requête indépendante).
--
-- Contexte : abonnement Enterprise payé le 30/09/2026 après cinq tentatives
-- au nom de trois personnes différentes, bloquées par Radar. user_id lu dans
-- les métadonnées de la session Stripe cs_live_b1wI6Tb…
-- ============================================================


-- ── 1. Identité et connexions ────────────────────────────────
-- Un compte ouvert pour valider un moyen de paiement a une société vide ou
-- fantaisiste, et une dernière connexion le jour du paiement.
select
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at,
  raw_app_meta_data->>'plan'              as plan,
  raw_user_meta_data->>'full_name'        as nom,
  raw_user_meta_data->>'company'          as societe,
  raw_user_meta_data->>'activity'         as activite,
  raw_user_meta_data->>'stripe_customer_id' as client_stripe,
  raw_user_meta_data->>'terms_accepted_at'  as cgu_acceptees
from auth.users
where id = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef';


-- ── 2. Ce qu'il a fait dans l'application ────────────────────
-- Un vrai client Enterprise ajoute des véhicules et des conducteurs dans les
-- premiers jours. Zéro partout = le produit ne l'intéressait pas.
select 'véhicules'            as donnee, count(*) from vehicles              where user_id = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
union all
select 'conducteurs',                    count(*) from drivers               where user_id = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
union all
select 'affectations',                   count(*) from assignments           where user_id = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
union all
select 'relevés kilométriques',          count(*) from mileage_entries       where user_id = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
union all
select 'entretiens',                     count(*) from maintenance_records   where user_id = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
union all
select 'contrôles techniques',           count(*) from technical_inspections where user_id = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
union all
select 'lavages',                        count(*) from wash_records          where user_id = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
union all
select 'documents conducteurs',          count(*) from driver_documents      where org_id  = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
union all
select 'actions journalisées',           count(*) from activity_log          where org_id  = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef';


-- ── 3. Le journal d'activité, s'il y en a un ─────────────────
select created_at, user_name, action, entity_type, entity_label
from activity_log
where org_id = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
order by created_at desc
limit 50;


-- ── 4. D'où il s'est connecté ────────────────────────────────
-- Les sessions gardent l'adresse IP et le navigateur. Des IP américaines,
-- ou des IP d'hébergeurs (centres de données, VPN), confirment le profil.
select created_at, updated_at, ip, user_agent
from auth.sessions
where user_id = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
order by created_at desc;


-- ── 5. Le journal d'authentification ─────────────────────────
-- Inscriptions, connexions, réinitialisations de mot de passe, avec l'IP.
select created_at, ip_address, payload->>'action' as action
from auth.audit_log_entries
where payload->>'actor_id' = 'e3e2dc66-6330-4b59-b552-9a0a006d0fef'
order by created_at desc
limit 50;


-- ── 6. D'autres comptes avec la même adresse ou le même client ──
-- Un fraudeur qui teste des cartes ouvre souvent plusieurs comptes.
select id, email, created_at, last_sign_in_at,
       raw_app_meta_data->>'plan' as plan
from auth.users
where email ilike '%rildeall%'
   or raw_user_meta_data->>'stripe_customer_id' = 'cus_VM1HAWek9XfyIc'
order by created_at;
