# Mots-clés par motif

File d'attente lue par la routine hebdomadaire (`SEO_ROUTINE.md`) et par le
skill `pattern-drip`. Une ligne = une requête visée et son URL. Tant qu'une
ligne n'a pas d'URL, elle attend sa page.

Les volumes ne sont pas renseignés : aucun outil de volume n'est branché. Ne
jamais en inventer. Le seul signal fiable est Search Console
(`marketing/search-console/<date>/`), cité avec sa date.

Statuts : **publiée**, **à optimiser** (une URL existe déjà, ne pas créer),
**à créer**, **attente** (page modifiée il y a moins de 60 jours, ne pas
toucher avant la date indiquée), **écartée**.

## Motif 1 — « gestion de flotte » + secteur (pages money)

Page de référence : `/secteurs/btp`, la page secteur qui a le plus
d'impressions au 2026-10-08. Les pages vivent dans `src/data/secteurs.js`.

| Priorité | Requête visée | URL | Statut | Note |
| --- | --- | --- | --- | --- |
| — | gestion de flotte transport routier | `/secteurs/transport-routier` | publiée | |
| — | gestion de flotte BTP | `/secteurs/btp` | publiée | |
| — | gestion de flotte VTC taxi | `/secteurs/vtc-taxi` | publiée | |
| — | gestion de flotte véhicules de société | `/secteurs/vehicules-de-societe` | publiée | |
| — | gestion flotte pour artisans | `/secteurs/btp` | attente → 2026-11-11 | 4 impressions en position 44 au 08/10. Brief : `briefs/gestion-flotte-artisans.md`. Ne pas créer de page `artisans`. |
| 1 | gestion de flotte ambulance VSL / transport sanitaire | — | à créer | Activité très réglementée (agrément, contrôle technique annuel, véhicules de remplacement). |
| 2 | gestion de flotte auto-école | — | à créer | Contrôle technique annuel, doubles commandes, véhicules très sollicités. |
| 3 | gestion de flotte livraison / messagerie (véhicules légers) | — | à créer | Faire un `page-brief` d'abord : risque de recouvrir `/secteurs/transport-routier`. |
| 4 | gestion de flotte déménagement | — | à créer | Même risque de recouvrement avec le transport routier : brief obligatoire. |
| 5 | gestion de flotte paysagiste | — | à créer, après le 2026-11-11 | Attendre l'optimisation « artisans » : recouvrement probable. |
| 6 | gestion de flotte dépannage remorquage | — | à créer | |

## Motif 2 — « logiciel » + modificateur (pages money)

| Requête visée | URL | Statut | Note |
| --- | --- | --- | --- |
| logiciel de gestion de flotte (PME) | `/` | publiée | La home porte ce terme seule depuis le 2026-10-08. |
| logiciel de gestion de parc automobile | `/logiciel-gestion-de-flotte` | attente → 2026-12-07 | Page recentrée le 2026-10-08. |
| gestion parc automobile gratuit | `/guides/gestion-parc-automobile-excel` | attente → 2026-12-07 | 8 impressions en position 7,8 au 08/10. Guide réaligné le 08/10 : ne pas créer de guide « logiciel gratuit », il lui prendrait sa requête. |
| suivi parc automobile excel / modèle | `/outils/modele-suivi-parc-automobile-excel` | publiée | |
| logiciel gestion flotte poids lourds | `/secteurs/transport-routier` | à optimiser | Pas de nouvelle page. |
| logiciel gestion de flotte open source | — | écartée | FleetDesk n'est pas open source : une page ici décevrait le visiteur. |

## Motif 3 — guides au service d'une page money

Un guide n'entre ici que s'il renvoie naturellement vers une page des motifs 1
ou 2 : on le publie pour cette page, pas pour le trafic.

| Requête visée | Page money servie | Statut |
| --- | --- | --- |
| temps de conduite et de repos | `/secteurs/transport-routier` | PR #24 ouverte |
| chronotachygraphe obligations | `/secteurs/transport-routier` | à créer, après la fusion de #24 (vérifier le recouvrement) |
| intervalle vidange utilitaire | `/guides/plan-entretien-vehicule-utilitaire` | PR #23 ouverte. Risque de recouvrement avec le plan d'entretien : à trancher avant de fusionner. |
| carte carburant entreprise comparatif | `/logiciel-gestion-de-flotte` | PR #25 ouverte |
| ZFE flotte entreprise | `/secteurs/vehicules-de-societe` | à créer |
