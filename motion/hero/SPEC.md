# Vidéo du hero : spécification

Boucle muette de 10,4 s. Elle illustre le titre du hero : « Zéro contrôle raté.
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

## Plans

| Temps | État |
| --- | --- |
| 0 → 1,0 s | Repos. « Tout est à jour ». |
| 1,0 / 1,35 / 1,7 s | Les trois alertes tombent l'une après l'autre ; le compteur monte à 1, 2, 3 échéances. |
| 3,0 s | Clic sur « Planifier le contrôle » : RDV le 5 novembre, la carte passe au vert. Compteur 2. |
| 3,85 → 4,65 s | Le certificat médical est glissé sur la visite médicale : valide jusqu'au 10/2031. Compteur 1. |
| 5,85 s | Clic sur « Enregistrer l'entretien » : prochaine vidange dans 30 000 km. « Tout est à jour ». |
| 6,6 s | « 0 contrôle raté · 0 document expiré · 0 panne surprise ». |
| 7,5 → 7,8 s | Les blocs redeviennent des pastilles « À jour ». |
| 9,3 → 10,4 s | La phrase s'efface, retour à l'image de départ. |

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
