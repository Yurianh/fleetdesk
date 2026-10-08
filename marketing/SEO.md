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

## Prochain lot (par ordre de priorité)

Réordonné le 2026-10-08 d'après Search Console (28 derniers jours, France : 69 impressions, 3 clics, tous sur la marque). Les sujets qui ont déjà un signal passent devant ceux qui n'en ont pas.

1. **Guide « Logiciel de gestion de parc automobile gratuit : ce qui existe vraiment »** — « gestion parc automobile gratuit » : 8 impressions en position 7,8, 0 clic ; « gestion de parc automobile gratuit » en position 2. L'intention « gratuit » est la plus présente des requêtes hors marque. Contenu honnête : le modèle Excel, les offres gratuites du marché et leurs contreparties, l'essai FleetDesk de 14 jours sans carte sur toutes les formules. Relié au guide Excel et à l'outil.
2. **Page secteur « Artisans »** — « gestion flotte pour artisans » : 4 impressions en position 44, aucune page dédiée. La formule Starter est présentée « pour les artisans et indépendants » ; la page doit le reprendre. Slug `artisans`, dans `src/data/secteurs.js`.
3. **Entretien et pannes** — « plan d'entretien véhicule utilitaire », « intervalle vidange utilitaire ».
4. **Coûts** — « TCO véhicule entreprise », « carte carburant entreprise comparatif ».
5. **Réglementaire** — « temps de conduite et de repos », « chronotachygraphe obligations », « ZFE flotte ».
6. **Comparatifs concurrents** — à ouvrir seulement quand le produit aura plus de recul client.
7. **Pages secteur additionnelles** — ambulances/VSL, auto-écoles, paysagistes, déménageurs.

Fait le 2026-10-08 : guide Excel réaligné sur l'intention « modèle gratuit » (titre, description, modèle présenté en tête, FAQ « logiciel gratuit »). Il recevait 17 impressions en position 12, la meilleure page hors marque, mais son titre promettait des « limites » à des gens qui cherchaient un outil — 0 clic, y compris en position 2 sur « suivi parc automobile ». À revoir dans 4 semaines : position et clics de `/guides/gestion-parc-automobile-excel`, et apparition de `/outils/modele-suivi-parc-automobile-excel` dans les impressions.

Cadence conseillée : 2 guides par mois, chacun relié au pilier et à une page secteur.

## Actions Search Console (manuelles)

- Soumettre `https://fleetdesk.fr/sitemap-index.xml` (l'ancien `/sitemap.xml` redirige en 301).
- Demander l'indexation des pages neuves : pilier, 4 secteurs, outil, 4 nouveaux guides.
- Vérifier que `app.fleetdesk.fr` sort de l'index (robots.txt `Disallow: /` + `noindex` sur l'app).
- Suivre mensuellement : impressions non-marque, pages indexées, requêtes en position 5-20 (à optimiser).
