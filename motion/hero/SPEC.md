# Vidéo du hero : spécification

Boucle muette de 22,8 s. Elle illustre le titre du hero : « Zéro contrôle raté.
Zéro document expiré. Zéro panne surprise. »

## Idée en une ligne

Trois cartes, une par promesse. Trois échéances arrivent, chacune se règle en
un geste, le compteur redescend à zéro. La dernière image est identique à la
première.

## Règles de style

- Fond plat, aucun dégradé, aucune inclinaison, aucun halo, aucun reflet.
- Couleurs FleetDesk : bleu pour l'action, ambre pour l'urgence, émeraude pour
  « à jour ». Pas de rouge.
- Polices du site : Onest, Spectral pour le titre.
- Dans chaque carte, une seule forme qui ne se coupe jamais : la pastille
  « À jour » devient le bloc d'alerte, puis redevient la pastille.
- Ressorts calculés (`../lib/motion.js`), `seek(t)` sans état.
- Rien qui ne soit dans l'application : alertes à 30 jours, visite médicale,
  vidange au kilométrage (alerte 5 000 km avant), e-mail des échéances.

## Décor

Tableau de bord « Transports Lemaire », compteur en haut à droite, trois cartes :
Contrôles techniques, Documents conducteurs, Entretien.

- Paysage 16:9 : 1536 × 864 CSS, rendu 1920 × 1080. Cartes côte à côte.
- Portrait 4:5 : 540 × 675 CSS, rendu 1080 × 1350 (`?format=portrait`). Cartes
  empilées, sans la ligne e-mail faute de place. Recomposé, pas recadré.

## Rythme

Un problème à la fois. Chaque échéance suit le même schéma : l'alerte arrive,
on laisse le temps de la lire (environ 2,5 s), elle se règle, on laisse le
temps de voir le résultat (environ 1,5 s), la carte se referme. Pendant ce
temps, les deux autres cartes s'estompent pour guider le regard, et une
légende sous les cartes dit ce qui se passe en une phrase.

## Plans

| Temps | État |
| --- | --- |
| 0 → 1,4 s | Repos. « Tout est à jour ». |
| 1,4 s | Contrôle technique du Boxer dans 30 jours. Légende : « Le contrôle technique approche : FleetDesk vous prévient 30 jours avant. » |
| 4,2 s | Clic sur « Planifier le contrôle ». Légende : « Planifié en un clic. » |
| 6,2 s | La carte se referme. |
| 7,2 s | Visite médicale de Sophie dans 15 jours. Légende : « … repérée à temps. » |
| 9,4 → 10,6 s | Le certificat est glissé sur la carte. Légende : « Certificat déposé : à jour jusqu'en 2031. » |
| 12,0 s | La carte se referme. |
| 13,0 s | Vidange du Master. Légende : « La vidange approche, calculée sur le kilométrage réel. » |
| 15,8 s | Clic sur « Enregistrer l'entretien ». Légende : « Entretien enregistré, prochaine dans 30 000 km. » |
| 17,8 s | La carte se referme. |
| 18,6 → 21,8 s | « 0 contrôle raté · 0 document expiré · 0 panne surprise ». |
| 22,8 s | Retour à l'image de départ. |

## Refaire la vidéo

```
cd motion
node render.mjs hero --stills 0,2,3.2,5,6.3       # images fixes à relire
node render.mjs hero --check-loop
node render.mjs hero                              # paysage
node render.mjs hero --format portrait            # mobile
```

Formats et sorties : `scene.json`. Rendu : Chromium de Playwright et `ffmpeg`
(`brew install ffmpeg`).
