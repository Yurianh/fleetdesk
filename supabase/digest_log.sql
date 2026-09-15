-- ============================================================
-- Journal des emails d'échéances — à exécuter dans le SQL Editor.
--
-- Sert de garde-fou anti-spam : la fonction `deadline-digest` consulte la
-- dernière ligne d'une organisation avant de renvoyer un email. `signature`
-- est l'empreinte des échéances envoyées ; si elle n'a pas bougé, on ne
-- réexpédie pas la même liste tous les jours.
-- ============================================================

create table if not exists public.digest_log (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null,
  sent_at    timestamptz not null default now(),
  signature  text not null,
  item_count integer not null default 0,
  urgent     boolean not null default false
);

create index if not exists digest_log_org_sent_idx on public.digest_log (org_id, sent_at desc);

-- Aucune politique : seule la clé service_role (la fonction edge) y accède.
alter table public.digest_log enable row level security;
