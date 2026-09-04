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

## Backlog (proposé, non planifié)

- Paiement échoué (`invoice.payment_failed` / `past_due`) : relance + bannière.
- Monitoring erreurs prod (Sentry edge + front) + alerte keep-alive cron.
- Activation premier run : empty states + checklist onboarding + welcome email.
- Preuve sociale réelle (1er client → logo + verbatim, publier CASE_STUDY).
