# Brief : « logiciel suivi entretien véhicule »

Établi le 2026-10-09 avec le skill `page-brief`.

## Décision : créer `/logiciel-suivi-entretien-vehicule`

- Search Console au 2026-10-08 : aucune impression sur la requête ni ses
  variantes. Aucune page ne la porte.
- Le site en parle dans `/guides/plan-entretien-vehicule-utilitaire` (guide de
  méthode, aucune impression) et dans une carte de `/features`. Aucune page ne
  vise la requête. Le guide répond à « comment faire », la nouvelle page à
  « quel outil prendre » : deux intentions, deux pages, reliées entre elles.
- Page 1 de Google (2026-10-09) : annuaires (GetApp, Capterra, Appvizer
  catégorie « entretien flotte ») et pages produit. C'est une intention
  d'achat.

## Mots-clés

- Principal : logiciel suivi entretien véhicule.
- Secondaires (Google Suggest, sans volume) : application suivi entretien
  véhicule, logiciel gestion entretien véhicule, logiciel suivi entretien
  voiture (+ gratuit), suivi entretien flotte.

## Title et description

- Title : « Logiciel de suivi d'entretien des véhicules » (43 caractères,
  55 avec « · FleetDesk »).
- Description : plan par véhicule en km et en mois, alerte avant
  l'échéance, historique et factures, prix d'entrée, essai sans carte.

## Ce que la page 1 a en commun

Liste de fonctions, prix, essai gratuit, avis (annuaires).

## Ce que personne n'a et qu'on peut ajouter honnêtement

Un exemple chiffré de la règle « la première des deux limites atteinte » :
deux utilitaires avec le même plan, l'un arrive à échéance par le compteur,
l'autre par le calendrier. C'est exactement le calcul de l'application
(`src/lib/maintenanceForecast.js`, alerte à 5 000 km ou 30 jours).

## Exactitude produit

- Saisie des kilométrages par les chauffeurs : formule Enterprise seulement.
  Sur les autres formules, c'est le gestionnaire qui saisit.
- E-mail récapitulatif hebdomadaire des échéances, envoyé plus tôt si une
  échéance devient urgente (`deadline-digest`).
- Les intervalles viennent du carnet du constructeur. FleetDesk ne fixe
  aucune périodicité.
