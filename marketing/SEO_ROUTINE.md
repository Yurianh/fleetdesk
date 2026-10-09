# Consigne de la routine SEO hebdomadaire

Ce fichier est la consigne complète de l'agent programmé chaque lundi. Modifier
ce fichier suffit à changer le comportement de la routine : rien à
reconfigurer côté planification.

Depuis le 2026-10-08, la routine ne publie plus un guide par semaine par
défaut. Chaque exécution fait **au plus une page**, dans cet ordre de
priorité : une page money à optimiser, puis une page secteur à créer, puis,
à défaut, un guide qui sert une page money. Les méthodes détaillées sont dans `.claude/skills/` :
`weekly-seo`, `page-brief`, `pattern-drip`, `ship-page`. Les lire avant de
commencer.

## 0. Garde-fou : ne pas empiler les PR

Lister les PR ouvertes sur des branches `seo/*` (`gh pr list --state open`).
S'il y en a **3 ou plus**, ne créer aucune page : faire seulement l'étape 1,
puis terminer le compte rendu en listant ces PR et en demandant qu'elles
soient relues. Trois pages en attente de relecture suffisent.

## 1. Revue de la semaine (`weekly-seo`)

Les exports Search Console sont déposés à la main dans
`marketing/search-console/<YYYY-MM-DD>/` (`Requêtes.csv`, `Pages.csv`…).

- Si le dossier le plus récent n'a pas encore de revue
  `marketing/reviews/<même date>.md`, appliquer `weekly-seo` : comparer avec
  l'export précédent, séparer marque et hors marque, lister ce qui attend
  (pages modifiées il y a moins de 60 jours : `git log -1 --format=%cs --
  <fichier>`), 5 actions classées par valeur commerciale. Écrire la revue.
- Mettre à jour `marketing/keywords.md` d'après la revue : nouvelles requêtes
  avec impressions, statuts « attente » arrivés à échéance.
- Pas de nouvel export : passer à l'étape 2 sans rien inventer.

## 2. Choisir la page

1. Ouvrir `marketing/keywords.md`. D'abord, toute ligne **à optimiser** ou
   **attente** dont la date est passée, tous motifs confondus. Sinon, motif 1
   (pages secteur) : la première ligne **à créer** dont les conditions sont
   remplies (date passée, brief demandé). Ensuite, motif 2 (pages fonction,
   référence `/logiciel-suivi-entretien-vehicule`) : décrire uniquement ce que
   le produit fait réellement, vérifié dans `src/` (code de l'application).
2. Appliquer `page-brief` dessus. Si la décision est **optimiser** une page
   existante : ne rien créer. Si la page à optimiser a été modifiée il y a
   60 jours ou plus, l'optimiser ; sinon noter « attente » avec la date dans
   `keywords.md` et passer à la ligne suivante.
3. Si le motif 1 n'a plus rien de prêt : motif 4 (guides au service d'une page
   money), même procédure.
4. Aucune ligne prête : ne rien publier, proposer trois requêtes dans le
   compte rendu.

## 3. Écrire

**Page secteur** : une nouvelle entrée dans `marketing/src/data/secteurs.js`,
construite à partir de la page de référence (`/secteurs/btp`) comme le décrit
`pattern-drip`. Mêmes champs, contenu entièrement propre au métier :
obligations réelles, véhicules, documents, FAQ. Une page qui ne change que le
nom du secteur ne part pas. Pour `activity`, reprendre la clé la plus proche
de `src/lib/activity.js` (`autre` à défaut).

**Guide** : `marketing/src/content/guides/<slug>.md`. Le frontmatter est validé
par zod : lire `marketing/src/content/config.ts` et prendre
`cout-revient-kilometrique.md` comme modèle. 1 000 à 1 400 mots. `title` ≤ 50
caractères (le layout ajoute « · FleetDesk »), `description` de 150 à 160
caractères, 4 entrées de `faq`, 3 `related`, 1 à 2 `sources` officielles
(service-public.fr, legifrance.gouv.fr, urssaf.fr, ants.gouv.fr). Dans le
corps, un lien vers la page money qu'il sert, avec la requête de cette page
comme ancre.

Pour les deux : ton sobre et direct, phrases courtes, aucun superlatif. On
écrit pour un gestionnaire pressé.

## 4. Exactitude : la règle qui prime sur tout le reste

Le sujet est réglementaire et français. **Ne jamais inventer un chiffre, un
délai, une périodicité, un montant ni un volume de recherche.** En cas de
doute, énoncer la règle en termes généraux, renvoyer vers la source
officielle et ajouter un `<p class="note">…</p>` qui signale que la valeur
dépend du cas.

## 5. Relier et vérifier (`ship-page`)

- Au moins 5 liens contextuels vers la nouvelle page depuis des pages
  existantes, dans le texte, là où le sujet est celui de la phrase. Ne pas
  modifier une page touchée il y a moins de 60 jours : en choisir une autre.
- Diff gate : lister tout ce que le diff retire (lien, section, FAQ). Rien ne
  doit disparaître sans justification écrite dans la PR.
- `cd marketing && npm ci && npm run build` doit passer.

## 6. Livrer

- Branche `seo/<slug>`, commit en anglais au format Conventional Commits,
  corps qui explique la requête visée, le statut dans `keywords.md` et la
  page money servie.
- Pousser et ouvrir une PR. **Ne jamais fusionner** : fusionner sur `main`
  publie le site.
- Si la publication échoue, coller le contenu complet dans le compte rendu
  pour qu'il ne soit pas perdu.

## 7. Compte rendu

La revue (ou « pas de nouvel export »), la page choisie et pourquoi, la
requête visée, l'URL de la PR (ou la raison de l'échec), les PR `seo/*`
encore ouvertes, et la prochaine ligne de `keywords.md`.
