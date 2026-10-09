# Mots-clés par motif

File d'attente lue par la routine hebdomadaire (`SEO_ROUTINE.md`) et par les
skills `money-keywords`, `page-brief` et `pattern-drip`. Une ligne = une
requête visée et son URL. Tant qu'une ligne n'a pas d'URL, elle attend sa
page.

Dernière passe `money-keywords` : **2026-10-09**. Sources :
- Search Console, 28 jours au 2026-10-08 (`search-console/2026-10-08/`) ;
- Google Suggest (fr-FR) sur 29 graines ;
- page 1 de Google pour les requêtes clés. L'outil de recherche utilisé
  n'est pas localisé en France : à recouper à la main sur google.fr avant
  toute création de page.

**Volumes** : aucun outil de volume n'est branché, la colonne vaut `n/a`.
Ne jamais en inventer. « Suggest » signifie que Google propose la requête :
la demande existe, sans dire combien. « SC » cite Search Console avec sa date.

**Statuts** : **publiée**, **à optimiser** (une URL existe déjà, ne pas créer),
**à créer**, **attente** (page modifiée il y a moins de 60 jours, ne pas
toucher avant la date indiquée), **écartée**.

**Ce que montre la page 1 partout** : les annuaires de logiciels (Appvizer,
GetApp, Capterra, La Fabrique du Net) tiennent la plupart des requêtes
commerciales. Y être référencé rapporte autant qu'une page. Voir la
dernière section.

## Motif 1 — « logiciel / gestion de flotte » + secteur ou type de véhicule

Pages money. Page de référence : `/secteurs/btp`. Les pages vivent dans
`src/data/secteurs.js`.

| Priorité | Requête | Volume | Ce que Google classe | Notre URL | Statut | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | logiciel gestion de flotte poids lourds | n/a (Suggest, + « camion », + « gratuit ») | comparatifs et pages catégorie | `/secteurs/transport-routier` | à optimiser | Le titre de la page ne dit ni « poids lourds » ni « camion ». À faire après le 2026-11-11 (60 jours). |
| 2 | logiciel gestion flotte vtc | n/a (Suggest) | pages produit (logiciels de dispatch), annuaires | `/secteurs/vtc-taxi` | à optimiser | Les concurrents en page 1 vendent du dispatch de courses. Angle : la conformité (contrôle annuel, cartes pro), pas le dispatch. Après le 2026-11-11. |
| — | gestion flotte pour artisans | n/a (SC 08/10 : 4 impressions, position 44) | articles généralistes | `/secteurs/btp` | attente → 2026-11-11 | Brief : `briefs/gestion-flotte-artisans.md`. Ne pas créer de page `artisans`. Suggest ne propose rien sur « artisan ». |
| — | gestion de flotte transport routier | n/a | — | `/secteurs/transport-routier` | publiée | |
| — | gestion de flotte BTP | n/a | — | `/secteurs/btp` | publiée | Suggest ne propose que « gestionnaire de parc BTP » (emploi). |
| — | gestion de flotte véhicules de société | n/a | — | `/secteurs/vehicules-de-societe` | publiée | |
| 3 | gestion de flotte ambulance VSL | n/a (pas de Suggest) | non vérifié | — | à créer | Activité très réglementée. Demande non confirmée : brief et contrôle de la page 1 d'abord. |
| 4 | gestion de flotte auto-école | n/a (pas de Suggest) | non vérifié | — | à créer | Même réserve. |
| 5 | gestion de flotte livraison / messagerie | n/a | non vérifié | — | à créer | Risque de recouvrir `/secteurs/transport-routier` : brief obligatoire. |
| 6 | gestion de flotte déménagement | n/a | non vérifié | — | à créer | Même risque. |
| 7 | gestion de flotte paysagiste | n/a | non vérifié | — | à créer, après le 2026-11-11 | Attendre l'optimisation « artisans ». |
| 8 | gestion de flotte dépannage remorquage | n/a | non vérifié | — | à créer | |

## Motif 2 — « logiciel / application » + fonction

Nouveau motif repéré le 2026-10-09. Pas encore de page de référence : la
première page fonction se fait en session, pas par la routine. La personne cherche un outil pour **une**
tâche précise. En page 1 : annuaires et pages produit, c'est-à-dire une
intention d'achat. Aucune page FleetDesk ne vise ces requêtes : `/features`
les couvre toutes à la fois, sous le titre « Fonctionnalités de gestion de
flotte ».

| Priorité | Requête | Volume | Ce que Google classe | Notre URL | Statut | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | logiciel suivi entretien véhicule | n/a (Suggest, + « application », + « gratuit ») | annuaires (GetApp, Capterra, Appvizer catégorie « entretien flotte ») et pages produit | — | à créer | `page-brief` d'abord : `/guides/plan-entretien-vehicule-utilitaire` est le guide sur le sujet. Il n'a aucune impression au 08/10 et vise une intention de lecture : la page fonction ne lui prendrait rien. |
| 2 | logiciel alerte contrôle technique flotte | n/a (pas de Suggest) | non vérifié | `/conformite` | à optimiser | Demande non confirmée. `/conformite` couvre déjà le sujet. |
| 3 | suivi véhicule entreprise (carnet, fiche) | n/a (Suggest : « excel », « carnet », « fiche ») | non vérifié | `/outils/modele-suivi-parc-automobile-excel` | à optimiser | Intention « modèle à télécharger ». L'outil est la bonne page : ajouter « carnet » et « fiche » à son texte. |
| — | application gestion de flotte automobile | n/a (Suggest) | non vérifié | `/` | à optimiser | L'application chauffeur sur téléphone est un argument que la home met peu en avant. |

## Motif 3 — « logiciel » + modificateur

| Requête | Volume | Ce que Google classe | Notre URL | Statut | Note |
| --- | --- | --- | --- | --- | --- |
| logiciel de gestion de flotte (automobile, PME) | n/a (Suggest) | — | `/` | publiée | La home porte seule ce terme depuis le 2026-10-08. |
| logiciel gestion parc automobile | n/a (Suggest) | — | `/logiciel-gestion-de-flotte` | attente → 2026-12-07 | Page recentrée le 2026-10-08. |
| logiciel gestion de flotte gratuit / gestion parc automobile gratuit | n/a (SC 08/10 : 8 impressions, position 7,8 ; nombreuses variantes Suggest) | comparatifs « que peut-on vraiment faire gratuitement » et annuaires filtrés « gratuit » | `/guides/gestion-parc-automobile-excel` | attente → 2026-12-07 | La page 1 répond « tableur ou Odoo Community », exactement ce que dit notre guide. Ne pas créer de guide « logiciel gratuit ». |
| gestion parc automobile excel (gratuit) | n/a (SC 08/10 : 2 impressions, position 21) | non vérifié | `/guides/gestion-parc-automobile-excel` + `/outils/…` | attente → 2026-12-07 | |
| logiciel gestion parc automobile open source | n/a (Suggest) | comparatifs et fiches Odoo Fleet | — | écartée | FleetDesk n'est pas open source : la page décevrait le visiteur. |
| plateforme / solution / outil gestion de flotte | n/a (Suggest) | non vérifié | `/` | publiée | Synonymes de la requête principale : pas de page à part. |

Écartées comme bruit : « emploi », « salaire », « recrutement »,
« formation » (offres d'emploi de gestionnaire de parc), « parc
informatique », « garage », « Tunisie », « Uber Eats ».

## Motif 4 — guides au service d'une page money

Un guide n'entre ici que s'il renvoie naturellement vers une page des motifs
1 à 3. On le publie pour cette page, pas pour le trafic.

| Requête | Page money servie | Statut |
| --- | --- | --- |
| temps de conduite et de repos | `/secteurs/transport-routier` | PR #24 ouverte |
| chronotachygraphe obligations | `/secteurs/transport-routier` | à créer, après la fusion de #24 (vérifier le recouvrement) |
| intervalle vidange utilitaire | `/guides/plan-entretien-vehicule-utilitaire` | PR #23 ouverte. Risque de recouvrement avec le plan d'entretien : à trancher avant de fusionner. |
| carte carburant entreprise comparatif | `/logiciel-gestion-de-flotte` | PR #25 ouverte |
| ZFE flotte entreprise | `/secteurs/vehicules-de-societe` | à créer |

## Hors site : annuaires de logiciels

Ces sites occupent la page 1 de « logiciel gestion de flotte gratuit »,
« poids lourds », « vtc » et « suivi entretien véhicule ». Y avoir une fiche
complète (captures, prix, essai de 14 jours) donne à FleetDesk une présence
sur ces requêtes sans attendre que le domaine monte. Inscription à faire par
Julian : Appvizer, GetApp / Capterra / Software Advice (même groupe), La
Fabrique du Net.

## Les 3 motifs à construire en premier (valeur commerciale)

1. **Logiciel + fonction (motif 2)**, en commençant par « logiciel suivi
   entretien véhicule ». C'est une intention d'achat, aucune page FleetDesk ne
   la vise, et l'entretien prévisionnel est un vrai point fort du produit.
   C'est la seule création de page prête à lancer, après un `page-brief`.
2. **Logiciel + secteur ou type de véhicule (motif 1)** : optimiser
   « poids lourds / camion » sur la page transport routier et « vtc » sur la
   page VTC le 2026-11-11, en même temps que « artisans » sur la page BTP.
   Les trois pages existent déjà : c'est le gain le moins cher.
3. **Annuaires** : ils tiennent la page 1 de presque toutes ces requêtes.
   Une fiche par annuaire, faite une fois, travaille sur tous les motifs.

« Gratuit » et « excel » ont du signal, mais la page qui les porte vient
d'être modifiée : on n'y touche plus avant le 2026-12-07.
