# SEO — FleetDesk

État de départ (Search Console, 3 mois au 12/09/2026) : 9 impressions, 5 clics, position moyenne 1,8.
Position 1,8 sur 9 impressions = trafic de marque uniquement. Le site n'était présent sur aucune requête
non-marque. Tout l'enjeu est donc la **couverture** : des pages qui répondent à des requêtes réellement tapées.

## Architecture de contenu

```
/                                   accueil — marque + requête générique
/logiciel-gestion-de-flotte         page pilier (guide d'achat)
/features, /conformite, /pricing    pages produit
/secteurs                           hub
  /secteurs/transport-routier
  /secteurs/btp
  /secteurs/vtc-taxi
  /secteurs/vehicules-de-societe
/guides                             hub éditorial (collection Astro)
  7 guides publiés
/outils/modele-suivi-parc-automobile-excel   aimant à liens (fichier .xlsx gratuit)
/souscrire/*, /legal                noindex / hors sitemap
```

Règle de maillage : chaque guide pointe vers la page pilier ou une page produit ; chaque page secteur
pointe vers 3 guides ; le hub guides et le footer couvrent tout le reste.

## Publier un guide

1. Créer `src/content/guides/<slug>.md` (frontmatter validé par `src/content/config.ts`).
2. Renseigner `title` (≤ 50 caractères, le suffixe « · FleetDesk » est ajouté), `description` (150-160),
   `heading`, `intro`, `tag`, `cardDesc`, `published`, `updated`, `order`, `faq`, `related`, `sources`.
3. C'est tout : la page, le hub `/guides`, le sitemap et les données structurées (Article, FAQPage,
   BreadcrumbList) se génèrent seuls.

## Cibles de requêtes couvertes

| Page | Requêtes visées |
| --- | --- |
| `/logiciel-gestion-de-flotte` | logiciel gestion de flotte, logiciel gestion parc automobile, outil gestion flotte PME |
| `/outils/modele-suivi-parc-automobile-excel` | modèle suivi parc automobile excel, tableau suivi véhicules entreprise gratuit |
| `/guides/controle-technique-flotte` | contrôle technique véhicule entreprise, périodicité contrôle technique utilitaire |
| `/guides/controle-technique-expire-sanctions` | amende contrôle technique expiré, sanction défaut contrôle technique |
| `/guides/documents-conducteur` | documents obligatoires conducteur, validité FCO, visite médicale poids lourd |
| `/guides/cout-revient-kilometrique` | coût de revient kilométrique, calcul coût km véhicule entreprise |
| `/guides/gestion-parc-automobile-excel` | gestion parc automobile excel, suivi flotte tableur |
| `/guides/carte-grise-vehicule-entreprise` | carte grise société, changement adresse carte grise entreprise |
| `/guides/assurance-flotte` | assurance flotte automobile, contrat flotte entreprise |
| `/secteurs/*` | gestion de flotte + transport routier / BTP / VTC / véhicules de société |

## Prochain lot

La file d'attente vit désormais dans `keywords.md`, rangée par motif, avec un statut par requête. C'est elle que lit la routine du lundi (`SEO_ROUTINE.md`). Priorité aux pages money (pages secteur) ; un guide n'est publié que s'il sert l'une d'elles.

Décisions du 2026-10-08 :

- **Pas de guide « logiciel de gestion de parc automobile gratuit ».** Le guide Excel a été réaligné le même jour sur cette intention (8 impressions en position 7,8 sur « gestion parc automobile gratuit »). Un second guide lui prendrait sa requête. On laisse le guide Excel se stabiliser jusqu'au 2026-12-07.
- **Pas de page « Artisans ».** « gestion flotte pour artisans » sort déjà sur `/secteurs/btp`, qui dit « BTP et artisans ». On optimise cette page après le 2026-11-11 (60 jours depuis sa dernière modification). Brief : `briefs/gestion-flotte-artisans.md`.
- **Home et page pilier séparées.** La home garde « logiciel de gestion de flotte » ; `/logiciel-gestion-de-flotte` vise « logiciel de gestion de parc automobile ».
- **Maillage des pages secteur.** Chacune reçoit au moins 5 liens contextuels depuis les guides.
- Comparatifs concurrents : toujours repoussés tant que le produit n'a pas plus de recul client.

À revoir début novembre avec un nouvel export Search Console : position et clics du guide Excel, apparition de l'outil `/outils/modele-suivi-parc-automobile-excel` dans les impressions, et pages secteur après le maillage.

Les exports se déposent dans `search-console/<YYYY-MM-DD>/` : la routine en fait la revue (`reviews/<date>.md`).

## Actions Search Console (manuelles)

- Soumettre `https://fleetdesk.fr/sitemap-index.xml` (l'ancien `/sitemap.xml` redirige en 301).
- Demander l'indexation des pages neuves : pilier, 4 secteurs, outil, 4 nouveaux guides.
- Vérifier que `app.fleetdesk.fr` sort de l'index (robots.txt `Disallow: /` + `noindex` sur l'app).
- Suivre mensuellement : impressions non-marque, pages indexées, requêtes en position 5-20 (à optimiser).
