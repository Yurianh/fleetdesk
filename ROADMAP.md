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

## Backlog (proposé, non planifié)

- (rien pour l'instant — proposer la suite : dunning avancé, exports, i18n, SEO)
