# Vidéo du hero : spécification

Boucle muette de 9,6 s pour le hero de fleetdesk.fr. Elle remplace la capture
d'écran inclinée, avec son halo et son reflet, qui « fait IA ».

## Idée en une ligne

Une échéance arrive, FleetDesk la voit 30 jours avant, on la traite, tout
revient à l'état « à jour ». La dernière image est identique à la première.

## Règles de style

- Fond plat, aucun dégradé, aucune inclinaison, aucun halo, aucun reflet.
- Couleurs FleetDesk : bleu `#0066FF` pour l'action, graphite pour le neutre,
  ambre pour l'urgence, émeraude pour « à jour ». Pas de rouge.
- Polices du site : Onest pour le texte, Spectral pour les titres.
- **Une seule forme, jamais coupée.** La pastille d'état du véhicule devient la
  carte d'alerte, puis redevient la pastille. Aucun fondu enchaîné entre deux
  plans.
- Mouvements en ressorts calculés (fonction pure du temps). Aucune courbe
  d'easing CSS, aucun minuteur : `seek(t)` dessine n'importe quel instant.
- Données réalistes et cohérentes avec la démo : Peugeot Boxer EF-456-GH,
  Thomas, flotte de 14 véhicules.

## Décor

- **Paysage** (1536 × 864 CSS, rendu 1920 × 1080) : un plateau blanc, à gauche
  la liste de 5 véhicules avec leur pastille « À jour », à droite le « Centre
  d'alertes », vide au repos (« Aucune échéance sous 30 jours »).
- **Portrait** (540 × 675 CSS, rendu 1080 × 1350), pour le mobile : 3 véhicules,
  le Centre d'alertes en dessous. Même histoire, mêmes temps, recomposée et non
  recadrée (`?format=portrait`).
- En haut à droite, un compteur : « Tout est à jour » (émeraude) ou
  « 1 échéance » (ambre).

## Plans

| Temps | État |
| --- | --- |
| 0,0 → 0,8 s | Repos. Tout est à jour. |
| 0,8 s | La pastille du Boxer passe à l'ambre « CT dans 30 j », le compteur aussi. |
| 2,0 s | La pastille quitte la ligne, qui garde son emplacement en pointillés, et grandit jusqu'à devenir la carte d'alerte. |
| 2,75 s | Ligne « Alerte envoyée par e-mail à Thomas ». |
| 3,3 s | Le curseur entre et va au bouton « Planifier le contrôle ». |
| 4,25 s | Clic. Le bouton devient « RDV jeudi 5 novembre ». |
| 5,25 s | Le procès-verbal glisse dans la carte. |
| 5,6 s | La carte passe à l'émeraude : « Contrôle passé, valide jusqu'au 05/11/2028 ». |
| 5,9 s | Le compteur repasse à « Tout est à jour ». |
| 6,0 s | Le curseur sort. |
| 7,2 s | La carte rétrécit et revient dans la ligne, en pastille émeraude « À jour ». |
| 8,4 → 9,6 s | Repos, identique à 0,0 s. |

## Pièges

- Le texte de la carte n'apparaît qu'une fois la forme assez grande, sinon il
  déborde pendant le morphing.
- Le premier et le dernier fichier image doivent être identiques au pixel près
  (vérifié par `render.mjs --check-loop`).
- Pas de son : le hero se lit en lecture automatique, muette.

## Livrables

`marketing/public/hero/fleetdesk-hero.mp4` et `fleetdesk-hero-portrait.mp4`
(H.264, 60 i/s), avec leur image fixe (`-poster.jpg`, image 0). Les images de
relecture vont dans `hero/review/` (ignoré par git).

## Refaire la vidéo

```
cd motion
npm install
npm run hero:stills     # images fixes à relire, et noter
npm run hero:loop       # vérifie la boucle
npm run hero            # paysage
node hero/render.mjs --portrait
```

Le rendu utilise le Chromium installé par Playwright et `ffmpeg`
(`brew install ffmpeg`).
