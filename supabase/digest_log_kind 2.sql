-- ============================================================
-- Extension du journal d'emails — à exécuter dans le SQL Editor.
--
-- `digest_log` servait un seul mécanisme (les échéances qui approchent). Il en
-- porte maintenant deux, plus le suivi des clics :
--   kind = 'deadline'         → une échéance approche
--   kind = 'activation'       → des données manquent, FleetDesk ne peut pas alerter
--   kind = 'activation_click' → l'utilisateur a cliqué le bouton de l'email
--
-- Une seule table plutôt qu'une deuxième : la cadence, l'anti-spam et les
-- métriques se lisent au même endroit.
-- ============================================================

alter table public.digest_log
  add column if not exists kind    text not null default 'deadline',
  add column if not exists details jsonb;

-- Le cooldown interroge toujours (org, kind, date) : un index dédié.
create index if not exists digest_log_org_kind_sent_idx
  on public.digest_log (org_id, kind, sent_at desc);

comment on column public.digest_log.kind is
  'deadline | activation | activation_click';
comment on column public.digest_log.details is
  'Contexte de l''envoi : totaux, champs manquants, raison de déclenchement.';
