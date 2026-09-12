# Consigne de la routine éditoriale hebdomadaire

Ce fichier est la consigne complète de l'agent programmé « FleetDesk — guide SEO
hebdomadaire ». Il écrit **un** guide par exécution. Modifier ce fichier suffit à
changer le comportement de la routine : rien à reconfigurer côté planification.

## 1. Choisir le sujet

1. Lire `marketing/SEO.md`, section « Prochain lot (par ordre de priorité) ».
2. Lister `marketing/src/content/guides/` pour voir ce qui existe déjà.
3. Prendre **le premier sujet de la liste qui n'a pas encore de guide**, et le
   formuler comme une requête réellement tapée par un gestionnaire de flotte
   (« plan d'entretien véhicule utilitaire », « temps de conduite et de repos »,
   « TCO véhicule d'entreprise »…).
4. Un seul guide par exécution. Si tous les sujets de la liste sont traités,
   proposer trois nouveaux sujets dans le compte rendu final et s'arrêter là.

## 2. Écrire le guide

Créer `marketing/src/content/guides/<slug>.md`.

Le frontmatter est validé par zod : **lire `marketing/src/content/config.ts`** et
respecter le schéma exactement. Prendre `cout-revient-kilometrique.md` comme
modèle de forme.

Règles de fond :

- 1 000 à 1 400 mots, en français.
- Ton sobre et direct : phrases courtes, aucun superlatif, pas d'introduction
  creuse. On écrit pour un gestionnaire pressé, pas pour un moteur.
- `title` ≤ 50 caractères — le suffixe « · FleetDesk » est ajouté automatiquement
  par le layout, ne pas le mettre dans le titre.
- `description` entre 150 et 160 caractères.
- Des `##` qui répondent à de vraies sous-questions, 4 entrées de `faq`,
  3 `related` vers des pages existantes, 1 à 2 `sources` officielles
  (service-public.fr, legifrance.gouv.fr, urssaf.fr, ants.gouv.fr).
- 2 à 3 liens internes dans le corps, vers `/logiciel-gestion-de-flotte`,
  `/conformite`, un autre `/guides/<slug>` ou
  `/outils/modele-suivi-parc-automobile-excel`.

## 3. Exactitude — la règle qui prime sur tout le reste

Le sujet est réglementaire et français. **N'invente jamais un chiffre, un délai,
une périodicité ou un montant.** En cas de doute : énoncer la règle en termes
généraux, renvoyer vers la source officielle, et ajouter un
`<p class="note">…</p>` signalant que la valeur dépend du cas. Une donnée fausse
sur une amende ou une échéance coûte plus cher que l'absence de guide.

## 4. Relier le guide au reste du site

Ajouter un lien vers le nouveau guide dans au moins un guide existant proche
(champ `related` ou lien dans le corps), pour qu'il ne reste pas orphelin.

## 5. Vérifier

```
cd marketing && npm ci && npm run build
```

Le build doit passer. Corriger toute erreur de schéma avant de livrer.

## 6. Livrer

- Créer une branche `seo/guide-<slug>`.
- Commit en anglais, format Conventional Commits, corps expliquant le sujet
  retenu et pourquoi (mot-clé visé, position dans le lot).
- Pousser et ouvrir une pull request si `gh` est disponible et authentifié.
- Si la publication échoue (pas d'accès dépôt), **coller le markdown complet du
  guide dans le compte rendu final** pour qu'il ne soit pas perdu.

## 7. Compte rendu

Terminer par : le sujet choisi, le mot-clé visé, l'URL de la PR (ou la raison de
l'échec), et le prochain sujet de la liste.
