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
- [ ] **T-S04** — (suivi) Vraie image OG 1200×630 (`/og-image.png`) au lieu du logo. Mettre à jour `sitemap.xml` à chaque nouvelle page.
- [x] **T-S05** — Cluster contenu conformité : hub `/guides` + 3 articles (CT flotte, documents conducteur, assurance flotte) via `GuideLayout` (schema Article + FAQPage + BreadcrumbList), liens internes croisés (pilier ↔ articles ↔ hub), lien footer site-wide, sitemap MAJ. _(2026-09-05)_
- [ ] **T-S06** — (suivi) Soumettre `sitemap.xml` (apex, pas www) dans Search Console + étendre le cluster (nouveaux sujets) selon les mots-clés qui performent.

---

## Backlog (proposé, non planifié)

- Vrai témoignage client (T-P02).
