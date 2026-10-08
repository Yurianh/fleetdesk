# Brief : « gestion flotte pour artisans »

Établi le 2026-10-08 avec le skill `page-brief`.

## Décision : optimiser `/secteurs/btp`, ne pas créer de page

- Search Console, 28 jours au 2026-10-08 : « gestion flotte pour artisans »
  a fait 4 impressions en position 43,75. Sur la même période, `/secteurs/btp`
  a fait 5 impressions en position 54,2. Aucune autre page ne se rapproche
  de cette position, donc c'est très probablement elle qui sort sur la
  requête. À confirmer avec un export filtré sur la requête.
- La page vise déjà le terme : title « Gestion de flotte BTP et artisans »,
  H1 « Gérer les utilitaires du BTP et des artisans ».
- Une page `/secteurs/artisans` lui prendrait sa requête : deux pages vers
  la 40e place au lieu d'une qui monte.

## Quand

Pas avant le **2026-11-11**. `src/data/secteurs.js` a été modifié le
2026-09-12 et la règle des 60 jours s'applique. Les liens ajoutés vers la page
le 2026-10-08 ne modifient pas la page elle-même.

## Mots-clés

- Principal : gestion flotte artisans.
- Secondaires (Search Console et Google Suggest, sans volume connu) :
  gestion de flotte BTP, gestion flotte engins BTP (1 impression en
  position 96), suivi véhicules artisan, logiciel flotte artisan.

## Title et description proposés

- Title : « Gestion de flotte pour artisans et BTP » (38 caractères, 50 avec
  « · FleetDesk »). « Artisans » passe en premier : c'est la requête qui a
  du signal.
- Description, pour vendre le clic : « 3 à 20 utilitaires, pas de
  gestionnaire dédié : échéances, entretien au kilométrage réel, documents
  centralisés. Dès 9 €/mois, essai 14 jours sans carte. »
  Recompter les caractères au moment de publier (150 à 160).

## Contenu à ajouter

- Une intro qui parle à l'artisan seul, pas seulement à l'entreprise de BTP :
  plombier, électricien, menuisier, chauffagiste avec 2 à 10 véhicules.
- La FAQ « artisan avec 4 véhicules » existe : la remonter en tête.
- Mettre la formule Starter en avant (présentée « pour les artisans et
  indépendants » sur `/pricing`).
- Mettre à jour le libellé du lien vers le guide Excel, retitré le
  2026-10-08 (« Suivi de parc automobile sur Excel : modèle gratuit et
  limites »).

## Ce qu'aucune page concurrente n'a, et qu'on peut ajouter honnêtement

Un exemple chiffré pour un artisan à 4 utilitaires : le nombre d'échéances
par an (contrôles techniques, entretiens, assurances) que le tableur doit
rappeler à lui seul. À construire à partir des périodicités des guides
existants, sans chiffre inventé.
