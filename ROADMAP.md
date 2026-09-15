# ROADMAP — FleetDesk

Légende: `[ ]` à faire · `[~]` en cours · `[x]` fait

---

## Phase G — Gating des features payantes

Objectif: bloquer l'accès aux features au-dessus du plan de l'organisation, de façon
non contournable (barrière serveur) + UX claire (upsell). Grille alignée sur le pricing.

**Matrice des capacités (strict)**

| Capacité | Plan minimum |
|---|---|
| Piloter, conformité, docs, dashboard de base | starter |
| Suivi des lavages + justificatifs | pro |
| Analytics avancés (barres classées) | pro |
| Inviter équipe (admin/membre) | enterprise |
| Comptes chauffeur (invite + saisie terrain) | enterprise |

**Principe grandfather:** on bloque les *nouvelles* actions au-dessus du plan ;
on ne révoque jamais l'accès aux membres/données déjà créés (client starter actuel protégé).

- [x] **T-G01** — Plan dans `app_metadata` (non éditable user). Webhook + confirm-payment l'écrivent. Missing = `starter`. _(2026-09-04)_
- [x] **T-G02** — `src/lib/capabilities.js` : matrice + `usePlan()` / `useCan(cap)` (lit `app_metadata.plan`). _(2026-09-04)_
- [x] **T-G03** — Gate serveur `invite-member` : rejette si org owner ≠ enterprise. Déployé. _(2026-09-04)_
- [x] **T-G04** — Gate serveur `set-driver-vehicles` : rejette si org owner ≠ enterprise. Déployé. _(2026-09-04)_
- [x] **T-G05** — Composant `UpgradePrompt` (upsell, deep-link `/Settings?section=plan`). _(2026-09-04)_
- [x] **T-G06** — Client : onglet Équipe (Settings) + card véhicules chauffeur (DriverDetail) gated < enterprise. _(2026-09-04)_
- [x] **T-G07** — Client : lavages — ajout gated (< pro), historique existant lisible. _(2026-09-04)_
- [x] **T-G08** — Client : analytics avancés Dashboard — upsell (< pro), KPI/timeline/alertes gardés. _(2026-09-04)_
- [~] **T-G09** — Tests : build OK, edge functions déployées. Reste vérif UI live (starter voit upsell / enterprise voit feature) + test 403 serveur.

---

## Phase B — Résilience facturation

- [x] **T-B01** — Webhook `invoice.payment_failed` → `app_metadata.billing_status='past_due'` ; `invoice.payment_succeeded` → `active`. Déployé. _(2026-09-04)_
- [x] **T-B02** — `BillingBanner` global (owner only) : alerte past_due + lien portail Stripe, monté dans AppLayout. _(2026-09-04)_
- [x] **T-B03** — Events `invoice.payment_failed` + `invoice.payment_succeeded` activés sur l'endpoint webhook Stripe. _(2026-09-04)_
- [ ] **T-B04** — Test : simuler échec (carte test `4000000000000341`) → bannière apparaît ; recovery → disparaît.
- [x] **T-B05** — Dunning avancé : emails Resend escaladés (`failed` avec date de prochaine tentative → `final` sans retry → `recovered` / `cancelled`), lien portail Stripe généré serveur-side. Déployé. _(2026-09-05)_
- [ ] **T-B06** — Test dunning : carte `4000000000000341` sur un renouvellement → email "Paiement échoué" ; échec final → email suspension.
- [x] **T-B07** — Sync plan auto-réparateur : edge `sync-plan` lit l'abo Stripe live → écrit `app_metadata.plan` ; client `usePlanSync` l'appelle 1×/session + refresh token si changé. Fin des correctifs SQL manuels (pré-migration / changements Stripe dashboard). Déployé. _(2026-09-05)_
- [x] **T-B08** — Seamless : `AuthContext.applyPlan` patche le plan local dès la réponse `sync-plan` → gates/UI à jour instant, sans déco/reco (le refresh JWT ne re-bake pas toujours `app_metadata`). _(2026-09-05)_
- [x] **T-B09** — Essai Pro vraiment sans carte : `payment_method_collection:'if_required'` + `trial_settings.end_behavior.missing_payment_method:'cancel'`. Colle enfin la promesse marketing (14j sans carte → auto-annulation → Starter si pas de CB). Déployé. _(2026-09-05)_

---

## Phase M — Monitoring (Vercel-native + logs Supabase)

- [x] **T-M01** — `ErrorBoundary` global : crash React → écran gracieux + reload, au lieu du white screen. _(2026-09-04)_
- [x] **T-M02** — Listeners globaux `window.error` / `unhandledrejection` → `console.error` (visibles browser + logs Vercel). _(2026-09-04)_
- [x] **T-M03** — Keep-alive durci : logs explicites, échec en 500 (déclenche l'alerte cron Vercel). _(2026-09-04)_
- [ ] **T-M04** — Activer les notifications Vercel : Settings → Notifications → cron failures + deployment failures (email). _(côté Julian)_
- [ ] **T-M05** — Repérer les logs Supabase Edge : Dashboard → Edge Functions → Logs (filtrer `[webhook]`, `[contact-form]`, etc.). _(ref)_
- [ ] **T-M06** — (Optionnel) Vercel Web Analytics / Speed Insights (natif, sans compte tiers) pour la visibilité usage.

---

## Phase A — Activation premier run

- [x] **T-A01** — Checklist onboarding (`GettingStarted`) : auto-complète depuis données réelles, flow guidé, dismissible, replay. _(pré-existant, vérifié 2026-09-04)_
- [x] **T-A02** — Empty states Véhicules / Conducteurs (`EmptyState`). _(pré-existant, vérifié 2026-09-04)_
- [x] **T-A03** — Welcome email post-paiement : envoyé à la 1re activation (dédupe), branded Resend `contact@fleetdesk.fr`, 3 étapes + CTA dashboard. Déployé. _(2026-09-04)_
- [ ] **T-A04** — Test : 1er checkout réel → welcome email reçu (dédupe sur re-appel confirm-payment).

---

## Phase X — Personnalisation par métier

Adapter l'app au secteur du gestionnaire (moins de features inutiles). 5 secteurs,
masquage réactivable.

- [x] **T-X01** — `src/lib/activity.js` : 5 secteurs (transport/vtc/btp/services/autre), défauts par secteur, `useFeatures()`/`useFeature()`. Collaborateurs = tout affiché. _(2026-09-05)_
- [x] **T-X02** — Onboarding : sélecteur "Votre activité" (étape flotte), stocké en `user_metadata.activity`. _(2026-09-05)_
- [x] **T-X03** — Application : Sidebar masque Lavages ; VehicleDetail masque Licence de transport (affichage + upload) selon le métier. _(2026-09-05)_
- [x] **T-X04** — Settings › Modules : changer le métier + toggles pour réactiver/masquer chaque module (override `feature_overrides`). _(2026-09-05)_
- [ ] **T-X05** — (suivi) Câbler `proDriverDocs` (filtrer types de docs conducteur transport) + propager le secteur aux collaborateurs (invite) + adapter le dashboard.

---

## Phase C — Conversion

- [x] **T-C01** — Page récap par plan `souscrire/[plan]` (getStaticPaths starter/pro/enterprise) : prix, essai, **liste inclus ✓ / non inclus ✗**, CTA. Funnel `noindex`. _(2026-09-05)_
- [x] **T-C02** — Reroute tous les CTA plan (home, pricing, hero, navbar, footer, CTASection, guides, conformité) → `/souscrire/<plan>` avant la création de compte. Flow : récap → signup app → SetupProfile → Stripe. _(2026-09-05)_
- [x] **T-C03** — Rappel fin d'essai Pro, non-invasif : `sync-plan` expose `trial_end` (app_metadata) ; bannière in-app discrète (≤3j restants, dismissible/session, ton calme) → portail Stripe ; 1 email J-3 via webhook `customer.subscription.trial_will_end`. Déployé. _(2026-09-05)_
- [ ] **T-C04** — Activer l'event `customer.subscription.trial_will_end` sur l'endpoint webhook Stripe (dashboard). _(côté Julian)_

---

## Phase P — Preuve sociale _(fait 2026-09-04)_

- [x] **T-P01** — Retirer les faux témoignages (risque pratique trompeuse) → section signaux de confiance honnêtes sur la home. _(2026-09-04)_
- [ ] **T-P02** — Brancher un vrai témoignage client (consentement + citation + logo) quand disponible.

---

## Phase E — Exports

- [x] **T-E01** — Helper `exportCsv.js` : CSV Excel-friendly (BOM UTF-8, CRLF, séparateur `;`, échappement RFC-4180), nom daté. _(2026-09-05)_
- [x] **T-E02** — Export CSV Véhicules (modèle, plaque, conducteur affecté, km, mise en circulation). _(2026-09-05)_
- [x] **T-E03** — Export CSV Conducteurs (nom, email, tél, naissance, adresse, cartes DKV/badge/lavage). _(2026-09-05)_
- [x] **T-E04** — Export CSV dépenses consolidé (maintenance `invoice_amount` + lavages `amount`), trié par date, total en toast. Sur page Maintenance. Carburant exclu (pas de montant en base). _(2026-09-05)_
- [x] **T-E05** — Rapport mensuel brandé (page `/Reports`) : sélecteur de mois, KPI, dépenses par catégorie (maintenance/carburant/lavages), top véhicules, échéances CT + docs du mois. Export PDF via print CSS (aperçu = document imprimé). _(2026-09-05)_
- [x] **T-E06** — Montant carburant sur la saisie km (colonne `mileage_entries.amount`, champ optionnel, affiché en liste, inclus à l'export dépenses type `Carburant`). SQL: `supabase/mileage_amount.sql`. _(2026-09-05)_ ⚠️ SQL à lancer.

---

## Phase S — SEO

- [x] **T-S01** — Layout : `robots` meta, `og:url`, `og:image`, `og:locale`, `twitter:image`, canonical propre + prop `jsonLd` (rendu `application/ld+json`). _(2026-09-05)_
- [x] **T-S02** — `robots.txt` + `sitemap.xml` statique (6 pages) dans `public/`. _(2026-09-05)_
- [x] **T-S03** — JSON-LD : Organization + SoftwareApplication + FAQPage (home) ; FAQPage + BreadcrumbList (conformité) → éligible rich results. _(2026-09-05)_
- [x] **T-S04** — Image OG 1200×630 (`/og-default.png`) générée et posée par défaut dans `Layout` (+ `og:image:width/height`). Sitemap désormais généré automatiquement (T-S08). _(2026-09-12)_
- [x] **T-S05** — Cluster contenu conformité : hub `/guides` + 3 articles (CT flotte, documents conducteur, assurance flotte) via `GuideLayout` (schema Article + FAQPage + BreadcrumbList), liens internes croisés (pilier ↔ articles ↔ hub), lien footer site-wide, sitemap MAJ. _(2026-09-05)_
- [ ] **T-S06** — Soumettre `https://fleetdesk.fr/sitemap-index.xml` dans Search Console (apex, pas www) + demander l'indexation des 10 pages neuves. _(côté Julian)_
- [x] **T-S07** — Bug titres : `<title>` cumulait deux fois « · FleetDesk » (`Conformité · FleetDesk · FleetDesk` en SERP). Suffixe dédupliqué dans `Layout`, titres > 60 caractères raccourcis, descriptions ramenées à 150-160. _(2026-09-12)_
- [x] **T-S08** — Sitemap automatique : intégration `@astrojs/sitemap` (épinglée 3.2.1, compatible Astro 4) avec filtre (`/souscrire`, `/legal` exclus) et priorités par type de page. `public/sitemap.xml` manuel supprimé, `robots.txt` pointe sur `sitemap-index.xml`, redirection 301 de l'ancienne URL. _(2026-09-12)_
- [x] **T-S09** — App hors index : `public/robots.txt` (`Disallow: /`) + `noindex, nofollow` et canonical vers le site public dans `index.html`. Le rewrite SPA `/(.*)` exposait des pages fantômes indexables. _(2026-09-12)_
- [x] **T-S10** — Guides en collection de contenu (`src/content/guides` + `config.ts` + route `[...slug]`) : publier un guide = 1 fichier `.md`. Hub `/guides` et sitemap générés depuis la collection. Bloc « Sources officielles » et dates ISO ajoutés au `GuideLayout`. _(2026-09-12)_
- [x] **T-S11** — Page pilier `/logiciel-gestion-de-flotte` (requête money) : définition, 6 critères de choix, comparatif des 4 approches, méthode de migration, FAQ, schema SoftwareApplication + FAQPage + BreadcrumbList. _(2026-09-12)_
- [x] **T-S12** — Pages secteur `/secteurs` + 4 pages (transport routier, BTP, VTC/taxi, véhicules de société), alignées sur les secteurs proposés à l'inscription (`src/lib/activity.js`). _(2026-09-12)_
- [x] **T-S13** — 4 nouveaux guides : contrôle technique expiré (sanctions), coût de revient kilométrique, parc automobile sur Excel, carte grise d'entreprise. Les 3 guides existants enrichis et migrés en `.md`. _(2026-09-12)_
- [x] **T-S14** — Aimant à liens `/outils/modele-suivi-parc-automobile-excel` : fichier `.xlsx` généré (4 onglets, échéances en couleur, mode d'emploi), téléchargement direct sans formulaire. _(2026-09-12)_
- [x] **T-S15** — Maillage interne : navbar (Secteurs, Guides), footer restructuré en 5 colonnes, bloc « Pour aller plus loin » sur la home, liens croisés guides ↔ secteurs ↔ pilier. _(2026-09-12)_
- [x] **T-S16** — Données structurées complétées : Product + Offer + FAQPage sur `/pricing`, BreadcrumbList sur `/features`, ItemList sur `/guides` et `/secteurs`. _(2026-09-12)_
- [x] **T-S17** — `marketing/SEO.md` : architecture de contenu, procédure de publication d'un guide, mots-clés couverts, prochain lot éditorial, actions Search Console. _(2026-09-12)_
- [ ] **T-S18** — Lot suivant (2 guides/mois) : entretien préventif, TCO, temps de conduite et repos, ZFE. Comparatifs concurrents repoussés tant que le produit manque de recul client.

---

## Phase N — Notifications

- [x] **T-N01** — Email d'échéances (`supabase/functions/deadline-digest`) : contrôles techniques, documents conducteurs et entretiens prévus à 30 jours, calculés côté serveur avec la même logique que `maintenanceForecast.js`. Envoi Resend, une fois par semaine au plus, devancé seulement si une échéance passe sous 7 jours et que la liste a changé — garde-fou par `digest_log` (empreinte des échéances). Cron Vercel quotidien `0 7 * * *` → `/api/deadline-digest` → fonction edge (deux secrets : celui de Vercel, celui de Supabase). _(2026-09-15)_
- [x] **T-N02** — Réglages › Notifications : interrupteur de réception, actif par défaut (on stocke l'exception `digest_opt_out`, pas le consentement). Les collaborateurs voient une explication : l'email part au propriétaire. Lien de désabonnement dans le pied de l'email. _(2026-09-15)_
- [x] **T-N05** — Email d'activation (`supabase/functions/activation-digest`) : détecte les comptes qui ont des véhicules mais pas les dates qui rendent les alertes possibles. Déclenchement si au moins un véhicule sans date de contrôle technique, sinon si la moitié de la flotte n'a aucun intervalle d'entretien ; les documents conducteur ne déclenchent jamais seuls. Compte à 0 véhicule ignoré (relève de l'accueil). Cooldown 7 j, relance à 21 j si rien n'a bougé, arrêt après 3 envois sans progrès, arrêt immédiat dès que les données sont complètes. _(2026-09-15)_
- [x] **T-N06** — Journal unifié : `digest_log` gagne `kind` (`deadline` / `activation` / `activation_click`) et `details` jsonb. Les deux mécanismes lisent et écrivent leur propre cadence sans interférer. Migration `supabase/digest_log_kind.sql`. _(2026-09-15)_
- [x] **T-N07** — Mesure du clic : le bouton de l'email passe par `/api/activation-click`, qui enregistre puis redirige vers `/Vehicles?missing=ct` — nouveau filtre d'URL qui ouvre la flotte sur les seuls véhicules sans date de contrôle. Requêtes de suivi dans `supabase/analytics/activation.sql`. _(2026-09-15)_
- [x] **T-N08** — Correction dans `deadline-digest` : la requête sélectionnait `maintenance_schedules.name`, colonne inexistante — elle échouait en silence, donc aucun entretien n'est jamais remonté depuis la mise en service. Remplacée par `notes`. _(2026-09-15)_
- [x] **T-N03** — Mise en service : `digest_log.sql` et `digest_log_kind.sql` exécutés, `CRON_SECRET` posé côté Supabase et Vercel. _(2026-09-15)_
- [x] **T-N04** — Validation en production : `deadline-digest` → 6 comptes scannés, 0 envoi (aucune échéance datée). `activation-digest` → 6 scannés, **4 comptes vides ignorés**, **2 éligibles, 2 emails envoyés**, 0 échec ; second passage immédiat → `skipped_cooldown: 2`, l'anti-spam et l'écriture du journal sont confirmés. _(2026-09-15)_
- [x] **T-N10** — **Véhicule hors parc** : colonne `vehicles.archived_at` (`supabase/vehicle_archive.sql`). Un véhicule vendu ou rendu sort des listes, des alertes, des prévisions et du quota de la formule, ferme son affectation en cours, mais garde tout son historique et se remet en service en un clic. `useVehicles()` ne renvoie plus que le parc actif ; `useVehiclesWithArchived()` sert les deux écrans qui gèrent le parc. Onglets « En service / Hors parc » sur la liste, badge sur la fiche, filtre appliqué aussi dans les deux fonctions d'email. _(2026-09-15)_
- [ ] **T-N09** — (constat) 4 comptes sur 6 n'ont **aucun véhicule** : le décrochage principal est en amont de l'activation, entre l'inscription et la première saisie. Mécanisme distinct à concevoir — montrer la valeur, pas lister ce qui manque.

## Phase D — Design du site (unification visuelle)

- [x] **T-D01** — Jeu d'icônes unique `marketing/src/lib/icons.js` + composant `Icon.astro` : mêmes icônes que l'app (lucide, trait 1,75), fini les SVG collés à la main avec des traits de 2 à 2,5. Home, fonctionnalités et conformité migrées. _(2026-09-12)_
- [x] **T-D02** — Maquette de la home refaite à l'identique de l'écran Tableau de bord réel : navigation (Flotte / Opérations + compte), actions rapides, bandeau de chiffres, utilisation des véhicules, activité récente, carte flotte, centre d'alertes groupé. _(2026-09-12)_
- [x] **T-D03** — Le rouge « danger » sort du site : états critiques en ambre hiérarchisé (ambre plein → ambre clair → neutre), cartes « problèmes » en neutre sobre. Plus aucune classe `red-*` / `orange-*` dans `marketing/src`. _(2026-09-12)_
- [x] **T-D04** — Contraste : tous les gris de texte remontés d'un cran (`zinc-400` → `500`, `500` → `600`), ambre et émeraude passés en 700/800 sur fonds pâles. `text-zinc-400` (2,8:1 sur blanc) ne porte plus de texte. _(2026-09-12)_
- [x] **T-D05** — Tableaux des guides en pleine largeur, listes numérotées stylées, emoji retirés des maquettes (👋, ⚠). _(2026-09-12)_
- [x] **T-D07** — Révélation cinématique de la maquette : l'écran arrive incliné (rotateX 10°), flou et décalé, se redresse en 1,4 s, puis le contenu se pose en cascade (navigation → en-tête → chiffres → barres qui se remplissent → alertes une à une), halo bleu et balayage lumineux. 100 % CSS (`global.css`) : la première version passait par IntersectionObserver et laissait la zone vide ~1 s le temps de l'hydratation React. Neutralisé sous `prefers-reduced-motion`. _(2026-09-12)_
- [x] **T-D08** — Version longue de la révélation : le texte du hero se pose ligne par ligne (80 → 840 ms), puis l'écran vide monte et se redresse (900 ms → 3,1 s), puis se remplit — navigation, chiffres, barres, alertes — pour finir vers 4,2 s, balayage lumineux compris. _(2026-09-12)_
- [x] **T-D09** — Chorégraphie d'atterrissage sur tout le site : `src/scripts/motion.js` marque le bloc de titre puis les cartes de chaque `section` (et du pied de page) et les révèle à l'entrée dans le champ, décalage 90 ms, plafonné à 560 ms. Fondu de page au chargement, barre de navigation en fondu simple (sticky : pas de translate). L'état caché est conditionné à `html.js-motion`, posé par un script inline en `<head>` : sans JS, ou sous `prefers-reduced-motion`, la page reste entièrement visible. _(2026-09-12)_
- [x] **T-D10** — Chorégraphie d'atterrissage dans l'app : `src/lib/motion.js` (classe `motion-on` sur `<html>`, posée avant le premier rendu dans `main.jsx`), keyframes dans `index.css`. Le contenu de route se rejoue à chaque changement d'écran (clé `location.pathname` dans `AppLayout`), et le tableau de bord enchaîne ses blocs (`app-stagger` sur la colonne principale et le rail droit). Pas d'inline script : la CSP de l'app est en `script-src 'self'`. _(2026-09-12)_
- [x] **T-D11** — Réglages › **Affichage** : interrupteur « Animations d'arrivée ». Par défaut activé, sauf si le système demande moins d'animations ; un choix explicite prime dans les deux sens. Stocké par appareil (`localStorage: fd-motion`). _(2026-09-12)_
- [x] **T-D12** — Parallaxe au survol de la maquette marketing : l'écran s'incline vers le curseur (±3,2° / ±2,4°), le halo glisse en sens inverse, inertie par `requestAnimationFrame`. Calques séparés (`.reveal-tilt`, `.reveal-depth`) pour ne pas entrer en conflit avec les `transform` des animations d'arrivée. Inactif au toucher et sous `prefers-reduced-motion`. _(2026-09-12)_
- [x] **T-D13** — Atterrissage du tableau de bord : **une seule fois par session**, au moment où le voile de chargement se lève (drapeau `fd-landed` en sessionStorage, remis à zéro par `signOut()`). Plus d'animation à chaque navigation. _(2026-09-12)_
- [x] **T-D14** — Chorégraphie fine : ~22 éléments marqués `data-land` (date, salutation, sous-titre, pastille d'échéances, chaque action rapide, chaque chiffre du bandeau, titre et lignes de l'analytique, entrées d'activité, cartes du rail). `runLanding()` les trie par **position à l'écran** (bandes de 24 px, gauche → droite) et attribue un retard décélérant (loi exponentielle, étalement 3,2 s) ; entrée en 1,5 s avec flou de 6 px, montée de 26 px et léger changement d'échelle. Les barres d'utilisation se remplissent en `scaleX` 240 ms après leur ligne. Séquence complète ≈ 4,7 s. _(2026-09-12)_
- [x] **T-D15** — Correction : les cartes (bandeau de chiffres, analytique, activité) n'étaient pas animées, leur fond blanc restait donc affiché **vide** pendant que leur contenu se posait. Les conteneurs entrent désormais avec leur contenu, et `runLanding()` garantit qu'aucun élément ne démarre avant son conteneur (+140 ms). La durée réelle de la séquence est calculée et renvoyée, pour ne pas retirer la classe avant la fin. _(2026-09-12)_
- [x] **T-D16** — Sélecteurs segmentés unifiés sur la pastille de marque (`bg-[#E5EEFF]` / `text-[#0052D6]`), au lieu de trois traitements différents : période du tableau de bord (piste grise + pastille ardoise), sélecteur de section mobile des réglages, et bascule mensuel/annuel de la page tarifs (pastille noire). Le tableau de bord reprend exactement la forme de la maquette marketing : pastilles posées à plat, sans piste. _(2026-09-14)_
- [x] **T-D17** — Infobulles maison sur les boutons-icônes (`IconTip`, Radix) : apparition en 120 ms au-dessus du bouton, fondu et légère montée, enchaînement immédiat d'une icône à l'autre. Remplace l'attribut `title` du navigateur — une seconde d'attente, boîte système qui recouvrait les icônes voisines, impossible à styler. 23 boutons couverts (liste véhicules bureau et mobile, fiche véhicule, kilométrage), chacun avec son `aria-label`. _(2026-09-15)_
- [x] **T-D18** — Suppression de compte : confirmation par saisie. Il faut recopier « SUPPRIMER » pour activer le bouton, avec la liste de ce qui sera détruit (véhicules, conducteurs, historiques, justificatifs) et la mention qu'aucune restauration n'est possible. Double verrou : le bouton est désactivé **et** le gestionnaire refuse l'appel sans la saisie. _(2026-09-15)_
- [x] **T-D19** — Palette d'urgence apaisée dans l'app : plus aucun rouge. Trois niveaux lisibles à l'intensité — ambre plein (dépassé), ambre clair (sous 7 jours), bleu de marque (sous 30 jours), émeraude (en règle). Tableau de bord et badges de statut véhicule alignés. Un écran ouvert chaque matin ne doit pas déclencher d'alarme. _(2026-09-15)_
- [x] **T-D20** — Titres du site composés lettre par lettre : découpage mots puis caractères au chargement (`motion.js`), fondu avec flou qui se dissipe, 16 ms entre deux lettres, plafonné à 900 ms. Aucune page modifiée, texte intact dans la source pour les moteurs, `aria-label` conservé et lettres masquées aux lecteurs d'écran. _(2026-09-15)_
- [x] **T-D21** — Toutes les coches du site passent au bleu de marque (tarifs, pages de souscription) : une coche verte au milieu d'une liste bleue se lit comme un statut, pas comme une inclusion. _(2026-09-15)_
- [x] **T-D22** — Accordéon des questions fréquentes fluide : la hauteur s'anime (420 ms à l'ouverture, 300 ms à la fermeture) au lieu du saut de `<details>`, et la réponse se découvre de gauche à droite par un masque en balayage. L'élément natif est conservé — sans JS, tout fonctionne — et le masque n'existe que pendant l'animation, pour qu'un échec laisse le texte lisible plutôt que masqué. _(2026-09-15)_
- [ ] **T-D06** — (suivi) Passer la même grille de contraste sur l'app (`text-zinc-400` massivement utilisé dans `src/pages`), pour que produit et site restent alignés.

---

## Backlog (proposé, non planifié)

- Vrai témoignage client (T-P02).
