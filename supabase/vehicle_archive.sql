-- ============================================================
-- Véhicule hors parc — à exécuter dans le SQL Editor.
--
-- Un véhicule vendu, détruit ou rendu au loueur restait « sans date de contrôle
-- technique » pour toujours : il polluait le centre d'alertes, faussait les
-- statistiques et déclenchait des relances sur une donnée que personne ne
-- saisira jamais. Le supprimer n'est pas une option — l'historique d'entretien
-- et les factures doivent rester consultables.
--
-- D'où une date de sortie plutôt qu'un statut : elle dit aussi *quand*.
-- ============================================================

alter table public.vehicles
  add column if not exists archived_at timestamptz;

-- Les écrans listent presque toujours le parc actif : l'index sert ce cas.
create index if not exists vehicles_user_active_idx
  on public.vehicles (user_id) where archived_at is null;

comment on column public.vehicles.archived_at is
  'Date de sortie du parc. NULL = véhicule en service. Le véhicule et son historique restent consultables.';
